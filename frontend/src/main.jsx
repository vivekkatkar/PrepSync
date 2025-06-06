import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Readable, Writable, Duplex } from 'readable-stream';
import { Buffer } from 'buffer';
import process from 'process';

window.global = globalThis; // Required for some internal uses
window.Buffer = Buffer;
window.process = process;

// Patch Node-style stream classes globally
window.ReadableStream = Readable;
window.WritableStream = Writable;
window.DuplexStream = Duplex;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
