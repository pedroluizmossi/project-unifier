import React from 'react';

interface FileStat {
  name: string;
  size: number;
}

const estimateTokenCost = (size: number) => {
  return Math.ceil(size / 4);
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileStatsPanel: React.FC<{ files: FileStat[] }> = ({ files }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  if (!files || files.length === 0) return null;

  // Filter files
  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort by size (descending)
  const sorted = [...filteredFiles].sort((a, b) => b.size - a.size);

  // Pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedFiles = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getFileExtension = (filename: string) => {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2) || 'file';
  };

  return (
    <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
            Tabela de Detalhes de Arquivos Interativa
            </h3>
            <p className="text-sm text-slate-400 mt-1">Análise e Custo de Token para Conteúdo de Diretório Local</p>
        </div>
        <div className="relative w-full sm:w-64">
            <input
                type="text"
                placeholder="Pesquisar arquivos..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-800/50 text-slate-400 font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Nome do Arquivo</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Caminho</th>
              <th className="px-6 py-4 text-right">Tamanho</th>
              <th className="px-6 py-4 text-right">Contagem de Tokens</th>
              <th className="px-6 py-4 text-right">Custo Estimado (USD)</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {paginatedFiles.map((stat, idx) => {
                const extension = getFileExtension(stat.name).toUpperCase();
                const tokens = estimateTokenCost(stat.size);
                // Mock cost calculation: $0.00002 per 1k tokens (approx GPT-3.5 input)
                const cost = (tokens / 1000 * 0.00002).toFixed(5);
                
                return (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{stat.name.split('/').pop()}</td>
                    <td className="px-6 py-4 text-slate-400">{extension}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs truncate max-w-[200px]" title={stat.name}>{stat.name}</td>
                    <td className="px-6 py-4 text-right text-slate-300">{formatBytes(stat.size)}</td>
                    <td className="px-6 py-4 text-right text-slate-300">{tokens.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-slate-300">${cost}</td>
                    <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700/30">
                            Processado
                        </span>
                    </td>
                  </tr>
                );
            })}
            {paginatedFiles.length === 0 && (
                <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        Nenhum arquivo encontrado.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                  Mostrando <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, sorted.length)}</span> de <span className="font-medium text-white">{sorted.length}</span> itens
              </div>
              <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded bg-slate-800 border border-slate-600 text-slate-300 text-sm disabled:opacity-50 hover:bg-slate-700 transition-colors"
                  >
                      Anterior
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Simple pagination logic for display
                        let pageNum = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                            pageNum = currentPage - 2 + i;
                            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                        }
                        
                        return (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 rounded flex items-center justify-center text-sm border ${currentPage === pageNum ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded bg-slate-800 border-slate-600 border text-slate-300 text-sm disabled:opacity-50 hover:bg-slate-700 transition-colors"
                  >
                      Próximo
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default FileStatsPanel;
