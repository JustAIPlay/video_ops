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
    <div className="flex flex-col h-full overflow-y-auto px-4 lg:px-8 py-8 w-full max-w-[1600px] mx-auto gap-8">
      
      {/* Header Card */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-center bg-white rounded-3xl p-6 shadow-xl shadow-slate-100 border border-white">
        <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 rotate-3 transform transition-transform hover:rotate-6">
                <Layers className="w-8 h-8 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-extrabold text-slate-800">系统配置</h2>
                <p className="text-slate-500 font-medium">管理飞书 API 连接与数据路由规则</p>
            </div>
        </div>

        <button
          onClick={() => onSave(formData)}
          className="flex items-center gap-2 px-8 py-3 bg-[#8C7CF0] hover:bg-[#7b6be6] text-white rounded-2xl font-bold shadow-lg shadow-violet-200 transition-all hover:-translate-y-1 active:scale-95 active:shadow-sm"
        >
          <Save className="w-5 h-5" />
          保存更改
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        
        {/* Left Column: Feishu API Config */}
        <div className="lg:col-span-1 space-y-8">
            <section className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-100 border border-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <Key className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-xl text-slate-800">凭证设置</h3>
                    <p className="text-sm text-slate-400">飞书开放平台应用凭证</p>
                </div>
              </div>
              
              <div className="space-y-6 relative z-10">
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
        </div>

        {/* Right Column: Mapping Config */}
        <div className="lg:col-span-2">
            <section className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-100 border border-white relative overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <Split className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">数据路由映射</h3>
                        <p className="text-sm text-slate-400">配置不同账号数据同步的目标多维表格</p>
                    </div>
                </div>
              </div>

              {/* Add New Mapping Form */}
              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 relative z-10">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    添加新规则
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-3 space-y-2">
                        <label className="text-xs font-semibold text-slate-400 ml-1">分组/账号名</label>
                        <input
                            type="text"
                            value={newAccount}
                            onChange={(e) => setNewAccount(e.target.value)}
                            placeholder="例如: 绿植"
                            className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm"
                        />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                        <label className="text-xs font-semibold text-slate-400 ml-1">Base Token</label>
                        <input
                            type="text"
                            value={newBaseToken}
                            onChange={(e) => setNewBaseToken(e.target.value)}
                            placeholder="多维表格 Token"
                            className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm"
                        />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                        <label className="text-xs font-semibold text-slate-400 ml-1">Table ID</label>
                        <input
                            type="text"
                            value={newTableId}
                            onChange={(e) => setNewTableId(e.target.value)}
                            placeholder="数据表 ID"
                            className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <button
                            onClick={handleAddMapping}
                            disabled={!newAccount || !newBaseToken || !newTableId}
                            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 transition-all active:scale-95"
                        >
                            添加
                        </button>
                    </div>
                </div>
              </div>

              {/* Mapping List */}
              <div className="space-y-3 relative z-10">
                {Object.entries(formData.accountTableMapping).length === 0 ? (
                    <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <Box className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">暂无映射规则，请在上方添加</p>
                    </div>
                ) : (
                    (Object.entries(formData.accountTableMapping) as [string, TargetConfig][]).map(([account, mapConfig]) => (
                        <div key={account} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-slate-100 hover:border-blue-100 hover:shadow-md hover:shadow-blue-50 rounded-2xl transition-all">
                            <div className="flex items-center gap-4 mb-3 md:mb-0">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
                                    {account.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-700">{account}</h5>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                                        <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">Base: {mapConfig.baseToken.substring(0, 8)}...</span>
                                        <ArrowRight className="w-3 h-3" />
                                        <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">Table: {mapConfig.tableId.substring(0, 8)}...</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveMapping(account)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                title="删除规则"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                )}
              </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;