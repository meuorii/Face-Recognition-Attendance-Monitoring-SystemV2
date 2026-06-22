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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          {/* Ginawang bg-white, pinalitan ang border ng #0A3A23 na may napakahinang opacity, at ginawang rounded-2xl */}
          <div className="relative bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-[#0A3A23]/10 max-w-2xl w-full p-8 transition-all">
            {/* Pinalitan ang kulay ng close button para umakma sa bagong puting tema */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-[#0A3A23]/40 hover:text-red-500 font-bold text-xl p-1 rounded-lg hover:bg-[#F5F3F0] transition-all"
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