import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { FiX, FiGithub, FiTrash2, FiDownload, FiRefreshCw } from 'react-icons/fi'
import { NodeLibrary, NodeLibraryItem } from '../../types'

const NodeLibraryModal: React.FC = () => {
  const { nodeLibraries, addNodeLibrary, removeNodeLibrary, setShowNodeLibraryModal } = useApp()
  const [githubUrl, setGithubUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'manage' | 'import'>('manage')

  const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (match) {
      return { owner: match[1], repo: match[2].replace('.git', '') }
    }
    return null
  }

  const fetchNodeLibrary = async (owner: string, repo: string): Promise<NodeLibraryItem[]> => {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/main`
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error('无法访问仓库')
    }
    
    const files = await response.json()
    const items: NodeLibraryItem[] = []
    
    for (const file of files) {
      if (file.name.endsWith('.jsonl')) {
        const contentResponse = await fetch(file.download_url)
        if (contentResponse.ok) {
          const content = await contentResponse.text()
          const lines = content.split('\n').filter(line => line.trim())
          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              items.push({
                id: data.id || `${file.name}-${items.length}`,
                name: data.name || data.nodeName || '未命名节点',
                description: data.Description || data.description || '',
                data: data,
                tags: data.tags || [],
                author: data.author,
                createdAt: data.createdAt,
              })
            } catch (e) {
              console.warn('Failed to parse node line:', line)
            }
          }
        }
      }
    }
    
    return items
  }

  const handleImport = async () => {
    if (!githubUrl.trim()) {
      setError('请输入GitHub仓库链接')
      return
    }

    const parsed = parseGitHubUrl(githubUrl)
    if (!parsed) {
      setError('无效的GitHub链接格式')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const items = await fetchNodeLibrary(parsed.owner, parsed.repo)
      
      const library: NodeLibrary = {
        id: `${parsed.owner}-${parsed.repo}`,
        name: parsed.repo,
        githubUrl: githubUrl,
        localPath: '',
        lastUpdated: new Date().toISOString(),
        items,
      }

      addNodeLibrary(library)
      setGithubUrl('')
      setActiveTab('manage')
    } catch (err: any) {
      setError(err.message || '导入失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (confirm('确定要删除这个节点库吗？')) {
      removeNodeLibrary(id)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal node-library-modal">
        <div className="modal-header">
          <h3 className="modal-title">节点库管理</h3>
          <button className="modal-close" onClick={() => setShowNodeLibraryModal(false)}>
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => setActiveTab('manage')}
            >
              已导入 ({nodeLibraries.length})
            </button>
            <button
              className={`tab ${activeTab === 'import' ? 'active' : ''}`}
              onClick={() => setActiveTab('import')}
            >
              导入节点库
            </button>
          </div>

          {activeTab === 'manage' && (
            <div className="node-library-list-container">
              {nodeLibraries.length === 0 ? (
                <div className="empty-state">
                  <p>暂无导入的节点库</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab('import')}
                  >
                    <FiDownload /> 导入节点库
                  </button>
                </div>
              ) : (
                <div className="library-list">
                  {nodeLibraries.map((lib) => (
                    <div key={lib.id} className="library-item">
                      <div className="library-info">
                        <div className="library-name">
                          <FiGithub /> {lib.name}
                        </div>
                        <div className="library-meta">
                          <span>{lib.items?.length || 0} 个节点</span>
                          <span>更新于 {new Date(lib.lastUpdated).toLocaleDateString()}</span>
                        </div>
                        <div className="library-url">{lib.githubUrl}</div>
                      </div>
                      <div className="library-actions">
                        <button className="btn btn-secondary btn-sm" title="刷新">
                          <FiRefreshCw />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm danger"
                          onClick={() => handleRemove(lib.id)}
                          title="删除"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="import-form">
              <div className="form-group">
                <label className="form-label">GitHub 仓库链接</label>
                <input
                  type="text"
                  className="input form-input"
                  placeholder="https://github.com/username/node-library"
                  value={githubUrl}
                  onChange={(e) => {
                    setGithubUrl(e.target.value)
                    setError('')
                  }}
                />
                {error && <span className="form-error">{error}</span>}
              </div>
              <div className="form-hint">
                <p>节点库格式要求：</p>
                <ul>
                  <li>Information/ - 包含节点库信息</li>
                  <li>main/ - 包含JSONL格式的节点文件</li>
                  <li>每个JSONL文件中每行是一个节点的JSON数据</li>
                  <li>节点数据需包含 Description 字段用于显示描述</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {activeTab === 'import' && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setActiveTab('manage')}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={isLoading}
              >
                {isLoading ? '导入中...' : '导入'}
              </button>
            </>
          )}
          {activeTab === 'manage' && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowNodeLibraryModal(false)}
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default NodeLibraryModal
