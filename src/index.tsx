/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createContext } from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App';

import 'react-toastify/dist/ReactToastify.css';
import './index.css';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container!);

window.ReactQueryClientContext =
  createContext(null) as unknown as typeof window.ReactQueryClientContext;

root.render(<App />);
