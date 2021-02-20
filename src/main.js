import './components/DownloadBox';
import './components/DownloadButton';

const panel = document.querySelector('.asTBcell.uwthumb');

panel.appendChild(document.createElement('a', { is: 'download-button' }));
