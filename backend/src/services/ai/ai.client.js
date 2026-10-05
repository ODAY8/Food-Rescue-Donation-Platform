// Minimal OpenAI-compatible chat client for Groq (and compatible providers).
// Uses global fetch — no SDK dependency. Returns parsed JSON when the model
// is asked for JSON output; throws on transport/HTTP errors so callers can
// fall back to deterministic logic.
const aiConfig = require("../../config/ai");

const AI_ERRORS = {
    NO_KEY: "AI_NOT_CONFIGURED",
    TIMEOUT: "AI_TIMEOUT",
    HTTP: "AI_HTTP_ERROR",
    NETWORK: "AI_NETWORK_ERROR",
    PARSE: "AI_PARSE_ERROR",
};

/**
 * Call a chat completion and return the message content (string).
 * @param {object} opts
 * @param {string} opts.model            provider model id
 * @param {Array}  opts.messages         OpenAI-style messages
 * @param {boolean} [opts.jsonMode]      request JSON object output
 * @param {Array}  [opts.images]         [{ mime, base64 }] for vision models
 * @returns {Promise<string>} message content
 */
async function callChatCompletion({ model, messages, jsonMode = false, images = [], maxTokens = 250 }) {
    if (!aiConfig.isAiEnabled()) {
        const err = new Error("AI provider is not configured");
        err.code = AI_ERRORS.NO_KEY;
        throw err;
    }

    const body = { model, messages };
    if (jsonMode) body.response_format = { type: "json_object" };
    if (maxTokens) body.max_tokens = maxTokens;
    if (images.length > 0) {
        const last = messages[messages.length - 1];
        last.content = [
            { type: "text", text: last.content },
            ...images.map((img) => ({
                type: "image_url",
                image_url: { url: `data:${img.mime};base64,${img.base64}` },
            })),
        ];
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), aiConfig.timeoutMs);

    let res;
    try {
        res = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${aiConfig.apiKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
    } catch (e) {
        const err = new Error(e.name === "AbortError" ? "AI request timed out" : "AI network error");
        err.code = e.name === "AbortError" ? AI_ERRORS.TIMEOUT : AI_ERRORS.NETWORK;
        throw err;
    } finally {
        clearTimeout(timer);
    }

    if (!res.ok) {
        const err = new Error(`AI provider returned HTTP ${res.status}`);
        err.code = AI_ERRORS.HTTP;
        err.status = res.status;
        throw err;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
}

/**
 * Convenience wrapper for structured (JSON) completions.
 * Parses the model output; throws AI_PARSE_ERROR if it is not valid JSON.
 */
async function callJsonCompletion(opts) {
    const content = await callChatCompletion({ ...opts, jsonMode: true });
    try {
        return JSON.parse(content);
    } catch (e) {
        const err = new Error("AI returned invalid JSON");
        err.code = AI_ERRORS.PARSE;
        throw err;
    }
}

module.exports = { callChatCompletion, callJsonCompletion, AI_ERRORS };
