const getHome = (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Food Rescue Donation Platform API 🚀"
    });
};

module.exports = {
    getHome
};