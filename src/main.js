import './components/DownloadButton';
import './components/DownloadBox';
import './components/PageItem';

const panel = document.querySelector('.asTBcell.uwthumb');

panel.appendChild(document.createElement('a', { is: 'download-button' }));
