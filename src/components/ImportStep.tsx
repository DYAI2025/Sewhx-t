import React, { useState } from 'react';
import { Upload } from 'lucide-react';

export default function ImportStep() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="clay-card rounded-[40px] p-8 flex flex-col items-center justify-center border border-white">
        <Upload size={48} className="text-[var(--color-primary)] mb-4" />
        <h3 className="text-xl font-bold mb-2">WhatsApp Text-Export</h3>
        <p className="text-[var(--color-text-secondary)] text-center">Drag & Drop oder Klicken</p>
      </div>
      
      <div className="clay-card rounded-[40px] p-8 flex flex-col items-center justify-center border border-white">
        <Upload size={48} className="text-[var(--color-primary)] mb-4" />
        <h3 className="text-xl font-bold mb-2">Audio-Dateien</h3>
        <p className="text-[var(--color-text-secondary)] text-center">OPUS, M4A, MP3, WAV</p>
      </div>
    </div>
  );
}
