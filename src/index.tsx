import ReactDOM from 'react-dom/client';

import { App } from './App';

import 'react-toastify/dist/ReactToastify.css';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root was not found');
}

const root = ReactDOM.createRoot(container);

root.render(<App />);
