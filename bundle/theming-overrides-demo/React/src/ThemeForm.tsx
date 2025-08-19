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
      <h2 className="theme-form-title">
        Edit Shared Theme
      </h2>

      <div className="theme-form-grid">
        <div className="theme-section">
          <h4 className="theme-section-header">Text & Colors</h4>
          <div className="theme-input-grid-2">
            <div className="theme-input-group">
              <label className="theme-label">Title</label>
              <input
                type="text"
                className="theme-input"
                value={
                  typeof theme.common?.title?.text === 'string'
                    ? theme.common.title.text
                    : ''
                }
                onChange={(e) =>
                  updateTheme('common.title.text', e.target.value)
                }
              />
            </div>
            <div className="theme-input-group">
              <label className="theme-label">Title Color</label>
              <input
                type="color"
                className="theme-input"
                value={theme.common?.title?.color || '#333333'}
                onChange={(e) =>
                  updateTheme('common.title.color', e.target.value)
                }
              />
            </div>
          </div>
          <div className="theme-input-grid-2">
            <div className="theme-input-group">
              <label className="theme-label">Subtitle</label>
              <input
                type="text"
                className="theme-input"
                value={
                  typeof theme.common?.subtitle?.text === 'string'
                    ? theme.common.subtitle.text
                    : ''
                }
                onChange={(e) =>
                  updateTheme('common.subtitle.text', e.target.value)
                }
              />
            </div>
            <div className="theme-input-group">
              <label className="theme-label">Background</label>
              <input
                type="color"
                className="theme-input"
                value={
                  theme.common?.background?.fill?.replace('ff', '') || '#ececec'
                }
                onChange={(e) =>
                  updateTheme('common.background.fill', e.target.value + 'ff')
                }
              />
            </div>
          </div>
        </div>

        <div className="theme-section">
          <h4 className="theme-section-header">Layout</h4>
          <div className="theme-input-grid-2">
            <div className="theme-input-group">
              <label className="theme-label">Left Padding</label>
              <input
                type="number"
                className="theme-input"
                value={theme.common?.padding?.left || 70}
                onChange={(e) =>
                  updateTheme('common.padding.left', parseInt(e.target.value))
                }
              />
            </div>
            <div className="theme-input-group">
              <label className="theme-label">Right Padding</label>
              <input
                type="number"
                className="theme-input"
                value={theme.common?.padding?.right || 70}
                onChange={(e) =>
                  updateTheme('common.padding.right', parseInt(e.target.value))
                }
              />
            </div>
          </div>
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
              <label className="theme-label">Y-Axis Title</label>
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
        </div>

        <div className="theme-section">
          <h4 className="theme-section-header">Area Styling</h4>
          <div className="theme-input-grid-3">
            <div className="theme-input-group">
              <label className="theme-label">Start</label>
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
            </div>
            <div className="theme-input-group">
              <label className="theme-label">Mid</label>
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
            </div>
            <div className="theme-input-group">
              <label className="theme-label">End</label>
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
          <div className="theme-input-grid-2">
            <div className="theme-input-group">
              <label className="theme-label">Stroke Color</label>
              <input
                type="color"
                className="theme-input"
                value={theme.line?.series?.stroke || '#788990'}
                onChange={(e) =>
                  updateTheme('line.series.stroke', e.target.value + 'ff')
                }
              />
            </div>
            <div className="theme-input-group">
              <label className="theme-label">Line Markers</label>
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
          <div className="theme-input-grid-2">
            <div className="theme-input-group">
              <label className="theme-label">Dash Length</label>
              <input
                type="number"
                className="theme-input"
                value={(theme.line?.series?.lineDash as any)?.[0] || 5}
                onChange={(e) =>
                  updateTheme('line.series.lineDash.0', parseInt(e.target.value))
                }
              />
            </div>
            <div className="theme-input-group">
              <label className="theme-label">Gap Length</label>
              <input
                type="number"
                className="theme-input"
                value={(theme.line?.series?.lineDash as any)?.[1] || 5}
                onChange={(e) =>
                  updateTheme('line.series.lineDash.1', parseInt(e.target.value))
                }
              />
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