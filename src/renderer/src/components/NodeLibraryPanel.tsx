import React from 'react'
import { NodeLibraryItem } from '../types'
import { FiSearch } from 'react-icons/fi'

interface NodeLibraryPanelProps {
  nodes: NodeLibraryItem[]
  position: { x: number; y: number }
  filter: string
  onFilterChange: (filter: string) => void
  onSelect: (node: NodeLibraryItem) => void
  onClose: () => void
}

const NodeLibraryPanel: React.FC<NodeLibraryPanelProps> = ({
  nodes,
  position,
  filter,
  onFilterChange,
  onSelect,
  onClose,
}) => {
  return (
    <div
      className="node-library-panel"
      style={{ left: position.x, top: position.y }}
    >
      <div className="node-library-header">
        <span className="node-library-title">节点库</span>
        <div className="search-input-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="input node-library-search"
            placeholder="搜索节点..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      <div className="node-library-list">
        {nodes.map((node, index) => (
          <div
            key={node.id || index}
            className="node-library-item"
            onClick={() => onSelect(node)}
          >
            <div className="node-library-item-name">{node.name}</div>
            <div className="node-library-item-desc">{node.description}</div>
            {node.tags && node.tags.length > 0 && (
              <div className="node-library-item-meta">
                {node.tags.map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {nodes.length === 0 && (
          <div className="node-library-empty">
            <p>没有找到匹配的节点</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NodeLibraryPanel
