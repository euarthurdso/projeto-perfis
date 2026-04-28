import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import './App.css'; // Tailwind já incluso

axios.defaults.baseURL = 'http://localhost:5000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carregar perfis
  const loadProfiles = async () => {
    try {
      const res = await axios.get('/api/profiles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfiles(res.data);
    } catch(e) {
      console.log('Carregando...');
    }
  };

  // Login automático admin
  useEffect(() => {
    if (token) {
      loadProfiles();
    }
  }, [token]);

  const login = async () => {
    setLoading(true);
    try {
      // Cria admin se não existir
      const res = await axios.post('/api/auth/register', {
        email: 'admin@site.com',
        password: '123456',
        name: 'Admin'
      });
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      toast.success('✅ Admin criado e logado!');
    } catch(e) {
      // Se já existe, faz login
      try {
        const res = await axios.post('/api/auth/login', {
          email: 'admin@site.com',
          password: '123456'
        });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        toast.success('✅ Login OK!');
      } catch(e2) {
        toast.error('❌ Erro: Backend não está rodando?');
      }
    }
    setLoading(false);
  };

  const uploadFiles = async () => {
    if (!files.length) {
      toast.error('Selecione arquivos!');
      return;
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      await axios.post('/api/admin/upload/primeiro', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(`✅ ${files.length} arquivos enviados!`);
      setFiles([]);
      loadProfiles();
    } catch(e) {
      toast.error('❌ Erro no upload');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      <Toaster position="top-center" />
      
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-4">
            🎭 Perfis de Usuário
          </h1>
          <p className="text-xl text-white/90">Upload fácil • Design moderno • Admin completo</p>
        </div>

        {/* Login ou Dashboard */}
        {!user ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/20 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">🚀 Iniciar Admin</h2>
            <button
              onClick={login}
              disabled={loading}
              className="w-full max-w-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-6 px-12 rounded-3xl font-black text-xl shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? '🔄 Carregando...' : '👑 LOGIN ADMIN (senha: 123456)'}
            </button>
            <p className="text-white/70 mt-4 text-sm">Backend deve estar rodando em localhost:5000</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* User Info */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">👋 {user.name}</h2>
                  <p className="text-white/80">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="bg-red-500/80 text-white px-6 py-2 rounded-2xl hover:bg-red-600 transition-all"
                >
                  🚪 Sair
                </button>
              </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6">📤 Upload Múltiplo</h3>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={e => setFiles(Array.from(e.target.files))}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-blue-500 file:to-purple-600 file:text-white hover:file:from-blue-600 hover:file:to-purple-700 mb-6 p-4 border-2 border-dashed border-white/30 rounded-2xl"
              />
              <button
                onClick={uploadFiles}
                disabled={!files.length}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Enviar {files.length} arquivo(s)
              </button>
            </div>

            {/* Perfis Gallery */}
            <div>
              <h3 className="text-3xl font-bold text-white mb-8 text-center">
                🖼️ Galeria ({profiles.length} perfis)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map(profile => (
                  <div key={profile._id} className="group bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all hover:-translate-y-2 hover:shadow-2xl">
                    <h4 className="text-xl font-bold text-white mb-4">{profile.name || 'Perfil'}</h4>
                    <div className="space-y-3">
                      {profile.photos?.map((photo, i) => (
                        <img
                          key={i}
                          src={`${axios.defaults.baseURL}${photo}`}
                          alt="Foto"
                          className="w-full h-64 object-cover rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300"
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      ))}
                    </div>
                    {profile.videos?.length > 0 && (
                      <p className="text-purple-200 mt-2">🎥 {profile.videos.length} vídeo(s)</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
