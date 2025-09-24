import React from 'react';
import cargaGif from '../Carga.gif';

const Loader: React.FC<{text?: string}> = ({ text }) => (
  <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <img src={cargaGif} alt="Cargando..." style={{ width: 180, height: 180, marginBottom: 24 }} />
    {text && <div style={{ color: '#555', fontWeight: 500, fontSize: 20 }}>{text}</div>}
  </div>
);

export default Loader; 