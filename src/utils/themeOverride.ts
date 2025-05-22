import type { AliasToken, ComponentTokenMap } from 'antd/es/theme/interface';
const primaryColor = 'var(--xagi-primary-color)';
const primaryColorHover = 'var(--xagi-primary-color-hover)';
const primaryColorActive = 'var(--xagi-primary-color-active)';
const buttonPrimaryColor = primaryColor;
const borderRadius = 8;
const successColor = 'var(--xagi-success-color)';
const successColorHover = 'var(--xagi-success-color-hover)';
const borderColor = 'var(--xagi-border-color-base)';
export const token: Partial<AliasToken> = {
  colorPrimary: primaryColor,
  colorPrimaryHover: primaryColorHover,
  colorPrimaryActive: primaryColorHover,
  colorPrimaryBorder: primaryColorActive,
  controlOutline: primaryColorHover,
  controlOutlineWidth: 0,
  colorSuccess: successColor,
  colorSuccessHover: successColorHover,
  colorBorder: borderColor,
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

type InputToken = Partial<ComponentTokenMap['Input'] | AliasToken>;
const Input: InputToken = {
  activeBorderColor: primaryColorActive,
};

type RadioToken = Partial<ComponentTokenMap['Radio'] | AliasToken>;
const Radio: RadioToken = {
  colorPrimary: primaryColor,
  colorPrimaryHover: primaryColorHover,
  colorPrimaryActive: primaryColorActive,
};

type CheckboxToken = Partial<ComponentTokenMap['Checkbox'] | AliasToken>;
const Checkbox: CheckboxToken = {
  colorPrimary: primaryColor,
  colorPrimaryHover: primaryColorHover,
  colorPrimaryActive: primaryColorActive,
};

export const components: ComponentTokenMap = {
  Button: Button as ComponentTokenMap['Button'],
  Select: Select as ComponentTokenMap['Select'],
  Input: Input as ComponentTokenMap['Input'],
  Radio: Radio as ComponentTokenMap['Radio'],
  Checkbox: Checkbox as ComponentTokenMap['Checkbox'],
};
