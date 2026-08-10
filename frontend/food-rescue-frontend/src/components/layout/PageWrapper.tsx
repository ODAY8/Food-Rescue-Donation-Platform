import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface PageWrapperProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export default function PageWrapper({ children, fullWidth }: PageWrapperProps) {
  return (
    <>
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`min-h-screen pt-16 ${fullWidth ? '' : ''}`}
      >
        {children}
      </motion.main>
      <Footer />
    </>
  );
}
