import type { AgChartThemeOverrides } from 'ag-charts-enterprise';
import './ThemeForm.css';

interface ThemeFormProps {
  theme: AgChartThemeOverrides;
  onThemeChange: (theme: AgChartThemeOverrides) => void;
}

export function ThemeForm({ theme, onThemeChange }: ThemeFormProps) {
  const updateTheme = (path: string, value: any) => {
    const newTheme = JSON.parse(JSON.stringify(theme));
    const keys = path.split('.');
    let current = newTheme;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    onThemeChange(newTheme);
  };

  return (
    <div className="theme-form">
      <h2 className="theme-form-title">Edit Shared Theme</h2>

      <div className="theme-form-grid">
        <div className="theme-section">
          <h4 className="theme-section-header">Layout</h4>
          <div className="theme-input-grid-2">
            <div className="theme-input-group">
              <label className="theme-label">X-Axis Title</label>
              <input
                type="text"
                className="theme-input"
                value={theme.common?.axes?.category?.bottom?.title?.text || ''}
                onChange={(e) =>
                  updateTheme(
                    'common.axes.category.bottom.title.text',
                    e.target.value
                  )
                }
              />
            </div>
            <div className="theme-input-group">
              <label className="theme-label">Y-Axis Title (Left)</label>
              <input
                type="text"
                className="theme-input"
                value={theme.common?.axes?.number?.left?.title?.text || ''}
                onChange={(e) =>
                  updateTheme(
                    'common.axes.number.left.title.text',
                    e.target.value
                  )
                }
              />
            </div>
          </div>
          <div className="theme-input-grid-2">
            <div className="theme-input-group">
              <label className="theme-label">Y-Axis Title (Right)</label>
              <input
                type="text"
                className="theme-input"
                value={theme.common?.axes?.number?.right?.title?.text || ''}
                onChange={(e) =>
                  updateTheme(
                    'common.axes.number.right.title.text',
                    e.target.value
                  )
                }
              />
            </div>
            <div className="theme-input-group"></div>
          </div>
        </div>

        <div className="theme-section">
          <h4 className="theme-section-header">Area Styling</h4>
          <div className="theme-colors-row">
            <span className="theme-label">Gradient:</span>
            <div className="theme-color-item">
              <input
                type="color"
                className="theme-input"
                value={
                  (theme.area?.series?.fill as any)?.colorStops?.[0]?.color ||
                  '#f0f8ff'
                }
                onChange={(e) =>
                  updateTheme(
                    'area.series.fill.colorStops.0.color',
                    e.target.value
                  )
                }
              />
              <label className="theme-label">Start</label>
            </div>
            <div className="theme-color-item">
              <input
                type="color"
                className="theme-input"
                value={
                  (theme.area?.series?.fill as any)?.colorStops?.[1]?.color ||
                  '#b0e0e6'
                }
                onChange={(e) =>
                  updateTheme(
                    'area.series.fill.colorStops.1.color',
                    e.target.value
                  )
                }
              />
              <label className="theme-label">Mid</label>
            </div>
            <div className="theme-color-item">
              <input
                type="color"
                className="theme-input"
                value={
                  (theme.area?.series?.fill as any)?.colorStops?.[2]?.color ||
                  '#add8e6'
                }
                onChange={(e) =>
                  updateTheme(
                    'area.series.fill.colorStops.2.color',
                    e.target.value
                  )
                }
              />
              <label className="theme-label">End</label>
            </div>
          </div>
          <div className="theme-input-grid-2">
            <div className="theme-input-group">
              <label className="theme-label">
                Rotation: {(theme.area?.series?.fill as any)?.rotation || 0}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                className="theme-range-input"
                value={(theme.area?.series?.fill as any)?.rotation || 0}
                onChange={(e) =>
                  updateTheme(
                    'area.series.fill.rotation',
                    parseInt(e.target.value)
                  )
                }
              />
            </div>
            <div className="theme-input-group">
              <label className="theme-label">Area Markers</label>
              <input
                type="checkbox"
                checked={theme.area?.series?.marker?.enabled || false}
                onChange={(e) =>
                  updateTheme('area.series.marker.enabled', e.target.checked)
                }
                className="theme-checkbox"
              />
            </div>
          </div>
        </div>

        <div className="theme-section">
          <h4 className="theme-section-header">Line Styling</h4>
          <div className="theme-colors-row">
            <div className="theme-color-group">
              <label className="theme-label">Stroke</label>
              <input
                type="color"
                className="theme-input"
                value={theme.line?.series?.stroke || '#788990'}
                onChange={(e) =>
                  updateTheme('line.series.stroke', e.target.value + 'ff')
                }
              />
            </div>
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <label className="theme-label">Markers</label>
              <input
                type="checkbox"
                checked={theme.line?.series?.marker?.enabled || false}
                onChange={(e) =>
                  updateTheme('line.series.marker.enabled', e.target.checked)
                }
                className="theme-checkbox"
              />
            </div>
          </div>
          <div className="theme-colors-row">
            <label className="theme-label" style={{ minWidth: '60px' }}>
              Line Dash:
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <label className="theme-label">Dash</label>
                <input
                  type="number"
                  className="theme-input"
                  style={{ width: '50px' }}
                  value={(theme.line?.series?.lineDash as any)?.[0] || 5}
                  onChange={(e) =>
                    updateTheme(
                      'line.series.lineDash.0',
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <label className="theme-label">Gap</label>
                <input
                  type="number"
                  className="theme-input"
                  style={{ width: '50px' }}
                  value={(theme.line?.series?.lineDash as any)?.[1] || 5}
                  onChange={(e) =>
                    updateTheme(
                      'line.series.lineDash.1',
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="theme-section">
          <h4 className="theme-section-header">Visibility</h4>
          <div className="theme-visibility-container">
            <label className="theme-checkbox-label">
              <input
                type="checkbox"
                checked={theme.common?.title?.enabled !== false}
                onChange={(e) =>
                  updateTheme('common.title.enabled', e.target.checked)
                }
                className="theme-visibility-checkbox"
              />
              Show Title
            </label>
            <label className="theme-checkbox-label">
              <input
                type="checkbox"
                checked={theme.common?.subtitle?.enabled !== false}
                onChange={(e) =>
                  updateTheme('common.subtitle.enabled', e.target.checked)
                }
                className="theme-visibility-checkbox"
              />
              Show Subtitle
            </label>
            <label className="theme-checkbox-label">
              <input
                type="checkbox"
                checked={theme.common?.legend?.enabled !== false}
                onChange={(e) =>
                  updateTheme('common.legend.enabled', e.target.checked)
                }
                className="theme-visibility-checkbox"
              />
              Show Legend
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
