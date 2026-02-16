import React from 'react'
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiChevronRight, FiX } from 'react-icons/fi'
import { CodeError, ErrorCategory } from '../services/errorChecker'

interface ErrorPanelProps {
  errors: CodeError[]
  onJumpToError: (error: CodeError) => void
  onClose: () => void
  onFixError?: (error: CodeError) => void
}

const categoryLabels: Record<ErrorCategory, string> = {
  'function-spell': '函数拼写错误',
  'bracket-mismatch': '括号不匹配',
  'case-error': '大小写错误',
  'variable-unused': '未使用的变量',
  'variable-undefined': '未定义的变量',
  'variable-once-used': '仅使用一次的变量',
  'syntax-error': '语法错误',
  'parameter-error': '参数错误',
}

const ErrorPanel: React.FC<ErrorPanelProps> = ({ errors, onJumpToError, onClose, onFixError }) => {
  const errorCount = errors.filter(e => e.type === 'error').length
  const warningCount = errors.filter(e => e.type === 'warning').length
  const infoCount = errors.filter(e => e.type === 'info').length

  const groupedErrors = errors.reduce((acc, error) => {
    const category = error.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(error)
    return acc
  }, {} as Record<ErrorCategory, CodeError[]>)

  const getIcon = (type: CodeError['type']) => {
    switch (type) {
      case 'error':
        return <FiAlertCircle className="error-icon error" />
      case 'warning':
        return <FiAlertTriangle className="error-icon warning" />
      case 'info':
        return <FiInfo className="error-icon info" />
    }
  }

  const getTypeClass = (type: CodeError['type']) => {
    return `error-item error-type-${type}`
  }

  return (
    <div className="error-panel">
      <div className="error-panel-header">
        <div className="error-summary">
          <h3>错误检查</h3>
          <div className="error-counts">
            {errorCount > 0 && (
              <span className="count error">
                <FiAlertCircle /> {errorCount} 错误
              </span>
            )}
            {warningCount > 0 && (
              <span className="count warning">
                <FiAlertTriangle /> {warningCount} 警告
              </span>
            )}
            {infoCount > 0 && (
              <span className="count info">
                <FiInfo /> {infoCount} 提示
              </span>
            )}
            {errors.length === 0 && (
              <span className="count success">
                没有发现问题
              </span>
            )}
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>
          <FiX />
        </button>
      </div>

      <div className="error-panel-content">
        {errors.length === 0 ? (
          <div className="no-errors">
            <FiInfo className="no-errors-icon" />
            <p>代码检查完成，没有发现问题</p>
          </div>
        ) : (
          Object.entries(groupedErrors).map(([category, categoryErrors]) => (
            <div key={category} className="error-category">
              <div className="category-header">
                <span className="category-label">
                  {categoryLabels[category as ErrorCategory] || category}
                </span>
                <span className="category-count">{categoryErrors.length}</span>
              </div>
              <div className="category-errors">
                {categoryErrors.map(error => (
                  <div
                    key={error.id}
                    className={getTypeClass(error.type)}
                    onClick={() => onJumpToError(error)}
                  >
                    <div className="error-main">
                      {getIcon(error.type)}
                      <div className="error-details">
                        <span className="error-message">{error.message}</span>
                        <span className="error-location">
                          第 {error.line} 行，第 {error.column} 列
                        </span>
                      </div>
                    </div>
                    <div className="error-actions">
                      {error.suggestion && onFixError && (
                        <button
                          className="fix-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onFixError(error)
                          }}
                        >
                          修复
                        </button>
                      )}
                      <FiChevronRight className="jump-icon" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ErrorPanel
