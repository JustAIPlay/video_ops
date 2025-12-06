import React, { useState } from 'react';
import { AppConfig, TargetConfig } from '../types';
import { Save, Plus, Trash2, Key, Split, ArrowRight, Box, Layers, Table } from 'lucide-react';

interface SettingsViewProps {
  config: AppConfig;
  onSave: (newConfig: AppConfig) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<AppConfig>(config);
  
  // New Mapping State
  const [newAccount, setNewAccount] = useState('');
  const [newBaseToken, setNewBaseToken] = useState('');
  const [newTableId, setNewTableId] = useState('');

  const handleChange = (field: keyof AppConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddMapping = () => {
    if (newAccount && newBaseToken && newTableId) {
      console.log(`[DEBUG] SettingsView: Adding Mapping for "${newAccount}" -> Base: ${newBaseToken}, Table: ${newTableId}`);
      setFormData(prev => ({
        ...prev,
        accountTableMapping: {
          ...prev.accountTableMapping,
          [newAccount]: {
            baseToken: newBaseToken,
            tableId: newTableId
          }
        }
      }));
      setNewAccount('');
      setNewBaseToken('');
      setNewTableId('');
    }
  };

  const handleRemoveMapping = (account: string) => {
    const newMapping = { ...formData.accountTableMapping };
    delete newMapping[account];
    setFormData(prev => ({ ...prev, accountTableMapping: newMapping }));
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 lg:px-12 py-8 w-full max-w-5xl mx-auto">
      
      <div className="flex justify-between items-end mb-8">
        <div>
            <h2 className="text-3xl font-extrabold text-slate-800">系统配置</h2>
            <p className="text-slate-500 mt-2 font-medium">配置飞书 API 连接与数据路由规则</p>
        </div>
        <button
          onClick={() => onSave(formData)}
          className="flex items-center gap-2 px-8 py-3 bg-[#8C7CF0] hover:bg-[#7b6be6] text-white rounded-2xl font-bold shadow-lg shadow-violet-200 transition-all hover:-translate-y-1 active:scale-95 active:shadow-sm"
        >
          <Save className="w-5 h-5" />
          保存更改
        </button>
      </div>

      <div className="space-y-8 pb-20">
        
        {/* Feishu API Config */}
        <section className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-100 border border-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                <Key className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-xl text-slate-800">凭证设置</h3>
                <p className="text-sm text-slate-400">设置飞书应用的访问凭证</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">App ID <span className="text-orange-400">*</span></label>
                <input
                  type="text"
                  value={formData.feishuAppId}
                  onChange={(e) => handleChange('feishuAppId', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl text-slate-700 font-mono text-sm focus:ring-2 focus:ring-[#8C7CF0] focus:bg-white transition-all outline-none"
                  placeholder="cli_..."
                />
            </div>
            <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">App Secret <span className="text-orange-400">*</span></label>
                <input
                  type="password"
                  value={formData.feishuAppSecret}
                  onChange={(e) => handleChange('feishuAppSecret', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl text-slate-700 font-mono text-sm focus:ring-2 focus:ring-[#8C7CF0] focus:bg-white transition-all outline-none"
                  placeholder="••••••••••••"
                />
            </div>
          </div>
        </section>

        {/* Routing Strategy */}
        <section className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-100 border border-white">
           <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <Split className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-xl text-slate-800">路由策略</h3>
                <p className="text-sm text-slate-400">将不同的账号分组映射到不同的表格</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-100">
             <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-3 space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">视频号用户/分组名</label>
                    <input
                      type="text"
                      value={newAccount}
                      onChange={(e) => setNewAccount(e.target.value)}
                      placeholder="例如: 运营大号_A"
                      className="w-full px-4 py-3 bg-white border-none rounded-xl text-slate-600 focus:ring-2 focus:ring-[#8C7CF0] transition-all outline-none"
                    />
                </div>
                <div className="hidden md:flex md:col-span-1 justify-center pb-4 text-slate-300">
                    <ArrowRight className="w-5 h-5" />
                </div>
                <div className="md:col-span-3 space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Base Token</label>
                    <input
                      type="text"
                      value={newBaseToken}
                      onChange={(e) => setNewBaseToken(e.target.value)}
                      placeholder="app..."
                      className="w-full px-4 py-3 bg-white border-none rounded-xl text-slate-600 font-mono text-xs focus:ring-2 focus:ring-[#8C7CF0] transition-all outline-none"
                    />
                </div>
                <div className="md:col-span-3 space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Table ID</label>
                    <input
                      type="text"
                      value={newTableId}
                      onChange={(e) => setNewTableId(e.target.value)}
                      placeholder="tbl..."
                      className="w-full px-4 py-3 bg-white border-none rounded-xl text-slate-600 font-mono text-xs focus:ring-2 focus:ring-[#8C7CF0] transition-all outline-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <button
                      onClick={handleAddMapping}
                      disabled={!newAccount || !newBaseToken || !newTableId}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#8C7CF0] hover:bg-[#7b6be6] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="md:hidden">添加映射</span>
                    </button>
                </div>
             </div>
          </div>

          <div className="space-y-3">
             {Object.keys(formData.accountTableMapping).length === 0 && (
                 <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                     暂无路由规则，请在上方添加。
                 </div>
             )}
             
             {Object.entries(formData.accountTableMapping).map(([account, target]) => {
                 const config = target as TargetConfig;
                 return (
                 <div key={account} className="group flex flex-col md:flex-row items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-lg hover:border-violet-100 transition-all">
                    <div className="flex-1 flex items-center gap-4 w-full">
                        <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                            <Box className="w-5 h-5 text-[#8C7CF0]" />
                        </div>
                        <span className="font-bold text-slate-700">{account}</span>
                    </div>
                    
                    <div className="hidden md:block text-slate-300">
                        <ArrowRight className="w-4 h-4" />
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 w-full">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 w-full md:w-auto flex-1">
                             <Layers className="w-3 h-3 text-slate-400" />
                             <span className="font-mono text-xs text-slate-500 truncate" title={config.baseToken}>Base: {config.baseToken}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 w-full md:w-auto flex-1">
                             <Table className="w-3 h-3 text-slate-400" />
                             <span className="font-mono text-xs text-slate-500 truncate" title={config.tableId}>Table: {config.tableId}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => handleRemoveMapping(account)}
                        className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
                 );
             })}
          </div>

        </section>

      </div>
    </div>
  );
};

export default SettingsView;