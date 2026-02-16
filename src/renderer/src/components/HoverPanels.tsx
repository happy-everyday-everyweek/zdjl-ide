import React, { useState, useEffect, useRef } from 'react'
import { FiCrosshair, FiDroplet, FiCheck, FiX, FiMove, FiInfo, FiBook } from 'react-icons/fi'
import { parseColor, rgbToHex } from '../services/aiCompletion'
import { NodeLibraryItem } from '../types'

interface CoordinateHoverPanelProps {
  x: string
  y: string
  position: { x: number; y: number }
  onApply: (x: string, y: string) => void
  onClose: () => void
  screenSize?: { width: number; height: number }
}

export const CoordinateHoverPanel: React.FC<CoordinateHoverPanelProps> = ({
  x,
  y,
  position,
  onApply,
  onClose,
  screenSize = { width: 1080, height: 2340 },
}) => {
  const [xValue, setXValue] = useState(x)
  const [yValue, setYValue] = useState(y)
  const [mode, setMode] = useState<'absolute' | 'percent'>('absolute')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (x.includes('%') || y.includes('%')) {
      setMode('percent')
    }
  }, [x, y])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const parseValue = (val: string): number => {
    if (val.includes('%')) {
      return parseFloat(val.replace('%', ''))
    }
    return parseInt(val) || 0
  }

  const convertToPercent = (val: string, total: number): string => {
    const num = parseValue(val)
    if (val.includes('%')) return val
    return `${((num / total) * 100).toFixed(1)}%`
  }

  const convertToAbsolute = (val: string, total: number): string => {
    if (!val.includes('%')) return val
    const percent = parseFloat(val.replace('%', ''))
    return Math.round((percent / 100) * total).toString()
  }

  const handleModeChange = (newMode: 'absolute' | 'percent') => {
    if (newMode === mode) return
    
    const newX = newMode === 'percent' 
      ? convertToPercent(xValue, screenSize.width)
      : convertToAbsolute(xValue, screenSize.width)
    const newY = newMode === 'percent'
      ? convertToPercent(yValue, screenSize.height)
      : convertToAbsolute(yValue, screenSize.height)
    
    setXValue(newX)
    setYValue(newY)
    setMode(newMode)
  }

  const handleApply = () => {
    onApply(xValue, yValue)
    onClose()
  }

  const handleIncrement = (axis: 'x' | 'y', delta: number) => {
    if (axis === 'x') {
      const current = parseValue(xValue)
      if (mode === 'percent') {
        setXValue(`${(current + delta).toFixed(1)}%`)
      } else {
        setXValue((current + delta).toString())
      }
    } else {
      const current = parseValue(yValue)
      if (mode === 'percent') {
        setYValue(`${(current + delta).toFixed(1)}%`)
      } else {
        setYValue((current + delta).toString())
      }
    }
  }

  const xNum = parseValue(xValue)
  const yNum = parseValue(yValue)

  return (
    <div
      ref={panelRef}
      className="hover-panel coordinate-panel"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="hover-panel-header">
        <FiCrosshair />
        <span>坐标编辑</span>
        <button className="hover-panel-close" onClick={onClose}>
          <FiX />
        </button>
      </div>
      
      <div className="hover-panel-content">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'absolute' ? 'active' : ''}`}
            onClick={() => handleModeChange('absolute')}
          >
            绝对值
          </button>
          <button
            className={`mode-btn ${mode === 'percent' ? 'active' : ''}`}
            onClick={() => handleModeChange('percent')}
          >
            百分比
          </button>
        </div>

        <div className="coordinate-inputs">
          <div className="coord-input-group">
            <label>X:</label>
            <div className="input-with-buttons">
              <button onClick={() => handleIncrement('x', -10)}>-10</button>
              <button onClick={() => handleIncrement('x', -1)}>-1</button>
              <input
                type="text"
                value={xValue}
                onChange={(e) => setXValue(e.target.value)}
              />
              <button onClick={() => handleIncrement('x', 1)}>+1</button>
              <button onClick={() => handleIncrement('x', 10)}>+10</button>
            </div>
          </div>
          
          <div className="coord-input-group">
            <label>Y:</label>
            <div className="input-with-buttons">
              <button onClick={() => handleIncrement('y', -10)}>-10</button>
              <button onClick={() => handleIncrement('y', -1)}>-1</button>
              <input
                type="text"
                value={yValue}
                onChange={(e) => setYValue(e.target.value)}
              />
              <button onClick={() => handleIncrement('y', 1)}>+1</button>
              <button onClick={() => handleIncrement('y', 10)}>+10</button>
            </div>
          </div>
        </div>

        <div className="coordinate-preview">
          <div 
            className="preview-dot"
            style={{
              left: mode === 'percent' ? `${xNum}%` : `${(xNum / screenSize.width) * 100}%`,
              top: mode === 'percent' ? `${yNum}%` : `${(yNum / screenSize.height) * 100}%`,
            }}
          />
          <div className="preview-label">
            {mode === 'percent' ? `${xValue}, ${yValue}` : `${xValue}px, ${yValue}px`}
          </div>
        </div>

        <div className="hover-panel-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleApply}>
            <FiCheck /> 应用
          </button>
        </div>
      </div>
    </div>
  )
}

interface NodeHoverPanelProps {
  nodeName: string
  position: { x: number; y: number }
  nodeData: NodeLibraryItem | null
  onClose: () => void
}

export const NodeHoverPanel: React.FC<NodeHoverPanelProps> = ({
  nodeName,
  position,
  nodeData,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const renderNodeData = () => {
    if (!nodeData || !nodeData.data) {
      return (
        <div className="node-hover-empty">
          <FiInfo />
          <span>未找到节点</span>
          <p className="node-hover-hint">节点 "{nodeName}" 未在节点库中找到</p>
        </div>
      )
    }

    const data = nodeData.data

    return (
      <div className="node-hover-content">
        {data.text && (
          <div className="node-hover-section">
            <div className="node-hover-label">节点文字</div>
            <div className="node-hover-value">{data.text}</div>
          </div>
        )}

        {data.idResName && (
          <div className="node-hover-section">
            <div className="node-hover-label">节点ID</div>
            <div className="node-hover-value">{data.idResName}</div>
          </div>
        )}

        {data.className && (
          <div className="node-hover-section">
            <div className="node-hover-label">节点类名</div>
            <div className="node-hover-value">{data.className}</div>
          </div>
        )}

        {data.packageName && (
          <div className="node-hover-section">
            <div className="node-hover-label">应用包名</div>
            <div className="node-hover-value">{data.packageName}</div>
          </div>
        )}

        {data.depth !== undefined && (
          <div className="node-hover-section">
            <div className="node-hover-label">节点深度</div>
            <div className="node-hover-value">{data.depth}</div>
          </div>
        )}

        {data.indexNum !== undefined && (
          <div className="node-hover-section">
            <div className="node-hover-label">匹配第几</div>
            <div className="node-hover-value">{data.indexNum}</div>
          </div>
        )}

        {data.limitArea && (
          <div className="node-hover-section">
            <div className="node-hover-label">限制区域</div>
            <div className="node-hover-value">{typeof data.limitArea === 'object' ? JSON.stringify(data.limitArea) : data.limitArea}</div>
          </div>
        )}

        <div className="node-hover-section">
          <div className="node-hover-label">位置信息</div>
          <div className="node-position-grid">
            <div className="position-item">
              <span className="position-label">Left</span>
              <span className="position-value">{data.boundLeft ?? '-'}</span>
            </div>
            <div className="position-item">
              <span className="position-label">Top</span>
              <span className="position-value">{data.boundTop ?? '-'}</span>
            </div>
            <div className="position-item">
              <span className="position-label">Right</span>
              <span className="position-value">{data.boundRight ?? '-'}</span>
            </div>
            <div className="position-item">
              <span className="position-label">Bottom</span>
              <span className="position-value">{data.boundBottom ?? '-'}</span>
            </div>
          </div>
          {data.boundLeft !== undefined && data.boundRight !== undefined && data.boundTop !== undefined && data.boundBottom !== undefined && (
            <div className="node-hover-value">
              宽: {data.boundRight - data.boundLeft} x 高: {data.boundBottom - data.boundTop}
            </div>
          )}
        </div>

        {(data.description || data.desc) && (
          <div className="node-hover-section">
            <div className="node-hover-label">节点描述</div>
            <div className="node-hover-value">{data.description || data.desc}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      className="hover-panel node-panel"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="hover-panel-header">
        <FiInfo />
        <span>节点详情</span>
        <button className="hover-panel-close" onClick={onClose}>
          <FiX />
        </button>
      </div>
      {renderNodeData()}
    </div>
  )
}

interface ColorHoverPanelProps {
  color: string
  position: { x: number; y: number }
  onApply: (color: string) => void
  onClose: () => void
}

export const ColorHoverPanel: React.FC<ColorHoverPanelProps> = ({
  color,
  position,
  onApply,
  onClose,
}) => {
  const initialColor = parseColor(color)
  const [r, setR] = useState(initialColor?.r || 0)
  const [g, setG] = useState(initialColor?.g || 0)
  const [b, setB] = useState(initialColor?.b || 0)
  const [hexValue, setHexValue] = useState(color.startsWith('#') ? color : `#${color}`)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    setHexValue(rgbToHex(r, g, b))
  }, [r, g, b])

  useEffect(() => {
    if (hexValue.startsWith('#') && hexValue.length === 7) {
      const parsed = parseColor(hexValue)
      if (parsed) {
        setR(parsed.r)
        setG(parsed.g)
        setB(parsed.b)
      }
    }
  }, [hexValue])

  const handleApply = () => {
    onApply(hexValue)
    onClose()
  }

  const handleSliderChange = (channel: 'r' | 'g' | 'b', value: number) => {
    if (channel === 'r') setR(value)
    else if (channel === 'g') setG(value)
    else setB(value)
  }

  const presetColors = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFFFFF', '#000000', '#FFA500', '#800080', '#008000', '#000080',
  ]

  return (
    <div
      ref={panelRef}
      className="hover-panel color-panel"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="hover-panel-header">
        <FiDroplet />
        <span>颜色编辑</span>
        <button className="hover-panel-close" onClick={onClose}>
          <FiX />
        </button>
      </div>
      
      <div className="hover-panel-content">
        <div className="color-preview-large" style={{ backgroundColor: hexValue }} />

        <div className="color-inputs">
          <div className="hex-input">
            <label>HEX:</label>
            <input
              type="text"
              value={hexValue}
              onChange={(e) => setHexValue(e.target.value.toUpperCase())}
              placeholder="#000000"
            />
          </div>

          <div className="rgb-sliders">
            <div className="slider-group">
              <label>R: {r}</label>
              <input
                type="range"
                min="0"
                max="255"
                value={r}
                onChange={(e) => handleSliderChange('r', parseInt(e.target.value))}
                className="slider-red"
              />
            </div>
            <div className="slider-group">
              <label>G: {g}</label>
              <input
                type="range"
                min="0"
                max="255"
                value={g}
                onChange={(e) => handleSliderChange('g', parseInt(e.target.value))}
                className="slider-green"
              />
            </div>
            <div className="slider-group">
              <label>B: {b}</label>
              <input
                type="range"
                min="0"
                max="255"
                value={b}
                onChange={(e) => handleSliderChange('b', parseInt(e.target.value))}
                className="slider-blue"
              />
            </div>
          </div>
        </div>

        <div className="preset-colors">
          {presetColors.map((presetColor) => (
            <button
              key={presetColor}
              className={`preset-color ${hexValue.toUpperCase() === presetColor ? 'selected' : ''}`}
              style={{ backgroundColor: presetColor }}
              onClick={() => {
                const parsed = parseColor(presetColor)
                if (parsed) {
                  setR(parsed.r)
                  setG(parsed.g)
                  setB(parsed.b)
                  setHexValue(presetColor)
                }
              }}
            />
          ))}
        </div>

        <div className="color-info">
          <div className="info-row">
            <span>十进制:</span>
            <span>{(r << 16) + (g << 8) + b}</span>
          </div>
          <div className="info-row">
            <span>RGB:</span>
            <span>rgb({r}, {g}, {b})</span>
          </div>
        </div>

        <div className="hover-panel-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleApply}>
            <FiCheck /> 应用
          </button>
        </div>
      </div>
    </div>
  )
}

interface SwipeCoordinateHoverPanelProps {
  x1: string
  y1: string
  x2: string
  y2: string
  position: { x: number; y: number }
  onApply: (x1: string, y1: string, x2: string, y2: string) => void
  onClose: () => void
  screenSize?: { width: number; height: number }
}

export const SwipeCoordinateHoverPanel: React.FC<SwipeCoordinateHoverPanelProps> = ({
  x1, y1, x2, y2,
  position,
  onApply,
  onClose,
  screenSize = { width: 1080, height: 2340 },
}) => {
  const [startX, setStartX] = useState(x1)
  const [startY, setStartY] = useState(y1)
  const [endX, setEndX] = useState(x2)
  const [endY, setEndY] = useState(y2)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleApply = () => {
    onApply(startX, startY, endX, endY)
    onClose()
  }

  const presetSwipes = [
    { name: '向上滑动', x1: '50%', y1: '80%', x2: '50%', y2: '20%' },
    { name: '向下滑动', x1: '50%', y1: '20%', x2: '50%', y2: '80%' },
    { name: '向左滑动', x1: '80%', y1: '50%', x2: '20%', y2: '50%' },
    { name: '向右滑动', x1: '20%', y1: '50%', x2: '80%', y2: '50%' },
  ]

  return (
    <div
      ref={panelRef}
      className="hover-panel swipe-panel"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="hover-panel-header">
        <FiMove />
        <span>滑动坐标编辑</span>
        <button className="hover-panel-close" onClick={onClose}>
          <FiX />
        </button>
      </div>
      
      <div className="hover-panel-content">
        <div className="swipe-preview">
          <div className="swipe-line-container">
            <div 
              className="swipe-start"
              style={{
                left: `${(parseInt(startX) / screenSize.width) * 100}%`,
                top: `${(parseInt(startY) / screenSize.height) * 100}%`,
              }}
            />
            <div 
              className="swipe-end"
              style={{
                left: `${(parseInt(endX) / screenSize.width) * 100}%`,
                top: `${(parseInt(endY) / screenSize.height) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="swipe-inputs">
          <div className="swipe-group">
            <label>起点:</label>
            <div className="coord-pair">
              <input
                type="text"
                value={startX}
                onChange={(e) => setStartX(e.target.value)}
                placeholder="X1"
              />
              <input
                type="text"
                value={startY}
                onChange={(e) => setStartY(e.target.value)}
                placeholder="Y1"
              />
            </div>
          </div>
          
          <div className="swipe-group">
            <label>终点:</label>
            <div className="coord-pair">
              <input
                type="text"
                value={endX}
                onChange={(e) => setEndX(e.target.value)}
                placeholder="X2"
              />
              <input
                type="text"
                value={endY}
                onChange={(e) => setEndY(e.target.value)}
                placeholder="Y2"
              />
            </div>
          </div>
        </div>

        <div className="preset-swipes">
          {presetSwipes.map((preset) => (
            <button
              key={preset.name}
              className="preset-swipe-btn"
              onClick={() => {
                setStartX(preset.x1)
                setStartY(preset.y1)
                setEndX(preset.x2)
                setEndY(preset.y2)
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="hover-panel-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleApply}>
            <FiCheck /> 应用
          </button>
        </div>
      </div>
    </div>
  )
}
