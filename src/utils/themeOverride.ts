import type { AliasToken, ComponentTokenMap } from 'antd/es/theme/interface';
const primaryColor = 'var(--xagi-primary-color)';
const primaryColorHover = 'var(--xagi-primary-color-hover)';
const primaryColorActive = 'var(--xagi-primary-color-active)';
const buttonPrimaryColor = primaryColor;
const borderRadius = 8;
const successColor = 'var(--xagi-success-color)';
const successColorHover = 'var(--xagi-success-color-hover)';

export const token: Partial<AliasToken> = {
  colorPrimary: primaryColor,
  colorPrimaryHover: primaryColorHover,
  colorPrimaryActive: primaryColorActive,
  colorSuccess: successColor,
  colorSuccessHover: successColorHover,
  borderRadius: borderRadius,
};
type ButtonToken = Partial<ComponentTokenMap['Button'] | AliasToken>;
const Button: ButtonToken = {
  colorPrimary: buttonPrimaryColor,
  primaryShadow: 'none',
  defaultShadow: 'none',
};

type SelectToken = Partial<ComponentTokenMap['Select'] | AliasToken>;
const Select: SelectToken = {
  colorPrimary: primaryColor,
  colorPrimaryHover: primaryColorHover,
  colorPrimaryActive: primaryColorActive,
  activeOutlineColor: 'transparent',
};

export const components: ComponentTokenMap = {
  Button: Button as ComponentTokenMap['Button'],
  Select: Select as ComponentTokenMap['Select'],
};
