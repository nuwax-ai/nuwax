import classNames from 'classnames';
import React from 'react';
import styles from './NavigationStylePanel.less';

const cx = classNames.bind(styles);

interface NavigationStylePanelProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

const NavigationStylePanel: React.FC<NavigationStylePanelProps> = ({
  isDarkMode,
  onThemeToggle,
}) => {
  return (
    <div className={cx(styles.navigationStylePanel)}>
      <h3 className={cx(styles.panelTitle)}>导航栏</h3>

      {/* 导航栏风格选择 */}
      <div className={cx(styles.navigationStyleSection)}>
        <div className={cx(styles.styleOptions)}>
          {/* 浅色模式 */}
          <div
            className={cx(styles.styleOption, {
              [styles.active]: !isDarkMode,
            })}
            onClick={() => !isDarkMode || onThemeToggle()}
          >
            <div className={cx(styles.stylePreview)}>
              <div className={cx(styles.navbarPreview, styles.lightNavbar)}>
                <div className={cx(styles.navbarContent)}>
                  <div className={cx(styles.navbarItem)}></div>
                  <div className={cx(styles.navbarItem)}></div>
                  <div className={cx(styles.navbarItem)}></div>
                </div>
              </div>
            </div>
            <div className={cx(styles.styleLabel)}>浅色</div>
          </div>

          {/* 深色模式 */}
          <div
            className={cx(styles.styleOption, {
              [styles.active]: isDarkMode,
            })}
            onClick={() => isDarkMode || onThemeToggle()}
          >
            <div className={cx(styles.stylePreview)}>
              <div className={cx(styles.navbarPreview, styles.darkNavbar)}>
                <div className={cx(styles.navbarContent)}>
                  <div className={cx(styles.navbarItem)}></div>
                  <div className={cx(styles.navbarItem)}></div>
                  <div className={cx(styles.navbarItem)}></div>
                </div>
              </div>
            </div>
            <div className={cx(styles.styleLabel)}>深色</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationStylePanel;
