// src/components/Common/ModalManager.jsx
import { createContext, useContext, useState } from "react";

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

const ModalManager = ({ children }) => {
  const [modalContent, setModalContent] = useState(null);

  const openModal = (content) => setModalContent(content);
  const closeModal = () => setModalContent(null);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}

      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          {/* Adjusted to max-w-4xl and increased padding to p-10 for a premium spacious layout */}
          <div className="relative bg-white rounded-3xl shadow-[0_32px_64px_-15px_rgba(10,58,35,0.15)] border border-[#0A3A23]/10 max-w-4xl w-full p-10 transition-all duration-300">
            
            {/* Elegant Close Button placement adjustments */}
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 text-[#0A3A23]/40 hover:text-[#950606] font-bold text-xl w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F5F3F0] transition-all duration-200"
            >
              ✕
            </button>
            {modalContent}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export default ModalManager;