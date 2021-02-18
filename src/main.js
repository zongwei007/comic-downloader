import './components/ResolveButton';
import './components/ResolveBox';
import './components/ResolveItem';

const panel = document.querySelector('.asTBcell.uwthumb');

panel.appendChild(document.createElement('a', { is: 'resolve-button' }));
