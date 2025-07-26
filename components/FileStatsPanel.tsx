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
  if (!files || files.length === 0) return null;

  // Ordena por tamanho (descendente)
  const sorted = [...files].sort((a, b) => b.size - a.size);

  return (
    <div className="bg-slate-900 rounded-xl p-6 shadow-lg mt-4 border border-slate-700">
      <h3 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
        <span className="material-icons text-indigo-400">insert_drive_file</span>
        File Sizes & Token Cost
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-slate-200">
          <thead>
            <tr className="bg-slate-800">
              <th className="text-left px-3 py-2">File</th>
              <th className="text-right px-3 py-2">Size</th>
              <th className="text-right px-3 py-2">Token Cost</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(stat => (
              <tr key={stat.name} className="hover:bg-slate-800/60 transition">
                <td className="px-3 py-2 font-mono break-all">{stat.name}</td>
                <td className="text-right px-3 py-2">{formatBytes(stat.size)}</td>
                <td className="text-right px-3 py-2 text-indigo-400 font-semibold">{estimateTokenCost(stat.size)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileStatsPanel;
