/*
 * _____                    _
 *|_   _|_      _____ _ __ | |_ _   _
 *  | | \ \ /\ / / _ \ '_ \| __| | | | Auto-generated file
 *  | |  \ V  V /  __/ | | | |_| |_| | Any edits to this will be overridden
 *  |_|   \_/\_/ \___|_| |_|\__|\__, |
 *                              |___/
 */

import React from 'react';
import {
  RemoteFragmentRenderer,
  createRemoteComponentRenderer,
} from '@remote-dom/react/host';
import {
  AnimatedButton,
  AnimatedLightIconButton,
  Button,
  ButtonGroup,
  FloatingButton,
  FloatingButtonGroup,
  FloatingIconButton,
  FloatingIconButtonGroup,
  InsideButton,
  LightButton,
  LightIconButton,
  LightIconButtonGroup,
  TabContent,
  CoreEditorHeader,
  ColorSchemeCard,
  ColorSchemePicker,
  Radio,
  SearchInput,
  Toggle,
  type AnimatedButtonProps,
  type AnimatedLightIconButtonProps,
  type ButtonProps,
  type ButtonGroupProps,
  type FloatingButtonProps,
  type FloatingButtonGroupProps,
  type FloatingIconButtonProps,
  type FloatingIconButtonGroupProps,
  type InsideButtonProps,
  type LightButtonProps,
  type LightIconButtonProps,
  type LightIconButtonGroupProps,
  type TabContentProps,
  type CoreEditorHeaderProps,
  type ColorSchemeCardProps,
  type ColorSchemePickerProps,
  type RadioProps,
  type SearchInputProps,
  type ToggleProps,
} from 'twenty-ui/input';
import {
  AvatarChip,
  MultipleAvatarChip,
  Chip,
  LinkChip,
  type AvatarChipProps,
  type MultipleAvatarChipProps,
  type ChipProps,
  type LinkChipProps,
} from 'twenty-ui/components';
import {
  Avatar,
  AvatarGroup,
  SidePanelInformationBanner,
  AnimatedCheckmark,
  Checkmark,
  ColorSample,
  Info,
  AppTooltip,
  type AvatarProps,
  type AvatarGroupProps,
  type SidePanelInformationBannerProps,
  type AnimatedCheckmarkProps,
  type CheckmarkProps,
  type ColorSampleProps,
  type InfoProps,
  type AppTooltipProps,
} from 'twenty-ui/display';
import { ProgressBar, type ProgressBarProps } from 'twenty-ui/feedback';
import {
  MenuPicker,
  MenuItem,
  MenuItemAvatar,
  MenuItemDraggable,
  MenuItemHotKeys,
  MenuItemNavigate,
  MenuItemSuggestion,
  MenuItemToggle,
  type MenuPickerProps,
  type MenuItemProps,
  type MenuItemAvatarProps,
  type MenuItemDraggableProps,
  type MenuItemHotKeysProps,
  type MenuItemNavigateProps,
  type MenuItemSuggestionProps,
  type MenuItemToggleProps,
} from 'twenty-ui/navigation';
const INTERNAL_PROPS = new Set(['element', 'receiver', 'components']);

const EVENT_NAME_MAP: Record<string, string> = {
  onclick: 'onClick',
  ondblclick: 'onDoubleClick',
  onmousedown: 'onMouseDown',
  onmouseup: 'onMouseUp',
  onmouseover: 'onMouseOver',
  onmouseout: 'onMouseOut',
  onmouseenter: 'onMouseEnter',
  onmouseleave: 'onMouseLeave',
  onkeydown: 'onKeyDown',
  onkeyup: 'onKeyUp',
  onkeypress: 'onKeyPress',
  onfocus: 'onFocus',
  onblur: 'onBlur',
  onchange: 'onChange',
  oninput: 'onInput',
  onsubmit: 'onSubmit',
  onscroll: 'onScroll',
  onwheel: 'onWheel',
  oncontextmenu: 'onContextMenu',
  ondrag: 'onDrag',
};

const parseStyle = (
  styleString: string | undefined,
): React.CSSProperties | undefined => {
  if (!styleString || typeof styleString !== 'string') {
    return styleString as React.CSSProperties | undefined;
  }

  const style: Record<string, string> = {};
  const declarations = styleString.split(';').filter(Boolean);

  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;

    const property = declaration.slice(0, colonIndex).trim();
    const value = declaration.slice(colonIndex + 1).trim();

    const camelProperty = property.replace(/-([a-z])/g, (_, letter: string) =>
      letter.toUpperCase(),
    );
    style[camelProperty] = value;
  }

  return style;
};

const wrapEventHandler = (handler: () => void) => {
  return (_event: unknown) => {
    handler();
  };
};

const filterProps = <T extends object>(props: T): T => {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (INTERNAL_PROPS.has(key) || value === undefined) continue;

    if (key === 'style') {
      filtered.style = parseStyle(value as string | undefined);
    } else {
      const normalizedKey = EVENT_NAME_MAP[key.toLowerCase()] || key;
      if (normalizedKey.startsWith('on') && typeof value === 'function') {
        filtered[normalizedKey] = wrapEventHandler(value as () => void);
      } else {
        filtered[normalizedKey] = value;
      }
    }
  }
  return filtered as T;
};
const HtmlDivWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('div', filterProps(props), children);
};
const HtmlSpanWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('span', filterProps(props), children);
};
const HtmlSectionWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('section', filterProps(props), children);
};
const HtmlArticleWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('article', filterProps(props), children);
};
const HtmlHeaderWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('header', filterProps(props), children);
};
const HtmlFooterWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('footer', filterProps(props), children);
};
const HtmlMainWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('main', filterProps(props), children);
};
const HtmlNavWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('nav', filterProps(props), children);
};
const HtmlAsideWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('aside', filterProps(props), children);
};
const HtmlPWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('p', filterProps(props), children);
};
const HtmlH1Wrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('h1', filterProps(props), children);
};
const HtmlH2Wrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('h2', filterProps(props), children);
};
const HtmlH3Wrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('h3', filterProps(props), children);
};
const HtmlH4Wrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('h4', filterProps(props), children);
};
const HtmlH5Wrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('h5', filterProps(props), children);
};
const HtmlH6Wrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('h6', filterProps(props), children);
};
const HtmlStrongWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('strong', filterProps(props), children);
};
const HtmlEmWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('em', filterProps(props), children);
};
const HtmlSmallWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('small', filterProps(props), children);
};
const HtmlCodeWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('code', filterProps(props), children);
};
const HtmlPreWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('pre', filterProps(props), children);
};
const HtmlBlockquoteWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('blockquote', filterProps(props), children);
};
const HtmlAWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('a', filterProps(props), children);
};
const HtmlImgWrapper = ({
  children: _children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('img', filterProps(props));
};
const HtmlUlWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('ul', filterProps(props), children);
};
const HtmlOlWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('ol', filterProps(props), children);
};
const HtmlLiWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('li', filterProps(props), children);
};
const HtmlFormWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('form', filterProps(props), children);
};
const HtmlLabelWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('label', filterProps(props), children);
};
const HtmlInputWrapper = ({
  children: _children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('input', filterProps(props));
};
const HtmlTextareaWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('textarea', filterProps(props), children);
};
const HtmlSelectWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('select', filterProps(props), children);
};
const HtmlOptionWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('option', filterProps(props), children);
};
const HtmlButtonWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('button', filterProps(props), children);
};
const HtmlTableWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('table', filterProps(props), children);
};
const HtmlTheadWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('thead', filterProps(props), children);
};
const HtmlTbodyWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('tbody', filterProps(props), children);
};
const HtmlTfootWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('tfoot', filterProps(props), children);
};
const HtmlTrWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('tr', filterProps(props), children);
};
const HtmlThWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('th', filterProps(props), children);
};
const HtmlTdWrapper = ({
  children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('td', filterProps(props), children);
};
const HtmlBrWrapper = ({
  children: _children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('br', filterProps(props));
};
const HtmlHrWrapper = ({
  children: _children,
  ...props
}: { children?: React.ReactNode } & Record<string, unknown>) => {
  return React.createElement('hr', filterProps(props));
};
const TwentyUiAnimatedButtonWrapper = (
  props: AnimatedButtonProps & { children?: React.ReactNode },
) => {
  return React.createElement(AnimatedButton, filterProps(props));
};
const TwentyUiAnimatedLightIconButtonWrapper = (
  props: AnimatedLightIconButtonProps & { children?: React.ReactNode },
) => {
  return React.createElement(AnimatedLightIconButton, filterProps(props));
};
const TwentyUiButtonWrapper = (
  props: ButtonProps & { children?: React.ReactNode },
) => {
  return React.createElement(Button, filterProps(props));
};
const TwentyUiButtonGroupWrapper = (
  props: ButtonGroupProps & { children?: React.ReactNode },
) => {
  return React.createElement(ButtonGroup, filterProps(props));
};
const TwentyUiFloatingButtonWrapper = (
  props: FloatingButtonProps & { children?: React.ReactNode },
) => {
  return React.createElement(FloatingButton, filterProps(props));
};
const TwentyUiFloatingButtonGroupWrapper = (
  props: FloatingButtonGroupProps & { children?: React.ReactNode },
) => {
  return React.createElement(FloatingButtonGroup, filterProps(props));
};
const TwentyUiFloatingIconButtonWrapper = (
  props: FloatingIconButtonProps & { children?: React.ReactNode },
) => {
  return React.createElement(FloatingIconButton, filterProps(props));
};
const TwentyUiFloatingIconButtonGroupWrapper = (
  props: FloatingIconButtonGroupProps & { children?: React.ReactNode },
) => {
  return React.createElement(FloatingIconButtonGroup, filterProps(props));
};
const TwentyUiInsideButtonWrapper = (
  props: InsideButtonProps & { children?: React.ReactNode },
) => {
  return React.createElement(InsideButton, filterProps(props));
};
const TwentyUiLightButtonWrapper = (
  props: LightButtonProps & { children?: React.ReactNode },
) => {
  return React.createElement(LightButton, filterProps(props));
};
const TwentyUiLightIconButtonWrapper = (
  props: LightIconButtonProps & { children?: React.ReactNode },
) => {
  return React.createElement(LightIconButton, filterProps(props));
};
const TwentyUiLightIconButtonGroupWrapper = (
  props: LightIconButtonGroupProps & { children?: React.ReactNode },
) => {
  return React.createElement(LightIconButtonGroup, filterProps(props));
};
const TwentyUiTabContentWrapper = (
  props: TabContentProps & { children?: React.ReactNode },
) => {
  return React.createElement(TabContent, filterProps(props));
};
const TwentyUiCoreEditorHeaderWrapper = (
  props: CoreEditorHeaderProps & { children?: React.ReactNode },
) => {
  return React.createElement(CoreEditorHeader, filterProps(props));
};
const TwentyUiColorSchemeCardWrapper = (
  props: ColorSchemeCardProps & { children?: React.ReactNode },
) => {
  return React.createElement(ColorSchemeCard, filterProps(props));
};
const TwentyUiColorSchemePickerWrapper = (
  props: ColorSchemePickerProps & { children?: React.ReactNode },
) => {
  return React.createElement(ColorSchemePicker, filterProps(props));
};
const TwentyUiRadioWrapper = (
  props: RadioProps & { children?: React.ReactNode },
) => {
  return React.createElement(Radio, filterProps(props));
};
const TwentyUiSearchInputWrapper = (
  props: SearchInputProps & { children?: React.ReactNode },
) => {
  return React.createElement(SearchInput, filterProps(props));
};
const TwentyUiToggleWrapper = (
  props: ToggleProps & { children?: React.ReactNode },
) => {
  return React.createElement(Toggle, filterProps(props));
};
const TwentyUiAvatarChipWrapper = (
  props: AvatarChipProps & { children?: React.ReactNode },
) => {
  return React.createElement(AvatarChip, filterProps(props));
};
const TwentyUiMultipleAvatarChipWrapper = (
  props: MultipleAvatarChipProps & { children?: React.ReactNode },
) => {
  return React.createElement(MultipleAvatarChip, filterProps(props));
};
const TwentyUiChipWrapper = (
  props: ChipProps & { children?: React.ReactNode },
) => {
  return React.createElement(Chip, filterProps(props));
};
const TwentyUiLinkChipWrapper = (
  props: LinkChipProps & { children?: React.ReactNode },
) => {
  return React.createElement(LinkChip, filterProps(props));
};
const TwentyUiAvatarWrapper = (
  props: AvatarProps & { children?: React.ReactNode },
) => {
  return React.createElement(Avatar, filterProps(props));
};
const TwentyUiAvatarGroupWrapper = (
  props: AvatarGroupProps & { children?: React.ReactNode },
) => {
  return React.createElement(AvatarGroup, filterProps(props));
};
const TwentyUiSidePanelInformationBannerWrapper = (
  props: SidePanelInformationBannerProps & { children?: React.ReactNode },
) => {
  return React.createElement(SidePanelInformationBanner, filterProps(props));
};
const TwentyUiAnimatedCheckmarkWrapper = (
  props: AnimatedCheckmarkProps & { children?: React.ReactNode },
) => {
  return React.createElement(AnimatedCheckmark, filterProps(props));
};
const TwentyUiCheckmarkWrapper = (
  props: CheckmarkProps & { children?: React.ReactNode },
) => {
  return React.createElement(Checkmark, filterProps(props));
};
const TwentyUiColorSampleWrapper = (
  props: ColorSampleProps & { children?: React.ReactNode },
) => {
  return React.createElement(ColorSample, filterProps(props));
};
const TwentyUiInfoWrapper = (
  props: InfoProps & { children?: React.ReactNode },
) => {
  return React.createElement(Info, filterProps(props));
};
const TwentyUiAppTooltipWrapper = (
  props: AppTooltipProps & { children?: React.ReactNode },
) => {
  return React.createElement(AppTooltip, filterProps(props));
};
const TwentyUiProgressBarWrapper = (
  props: ProgressBarProps & { children?: React.ReactNode },
) => {
  return React.createElement(ProgressBar, filterProps(props));
};
const TwentyUiMenuPickerWrapper = (
  props: MenuPickerProps & { children?: React.ReactNode },
) => {
  return React.createElement(MenuPicker, filterProps(props));
};
const TwentyUiMenuItemWrapper = (
  props: MenuItemProps & { children?: React.ReactNode },
) => {
  return React.createElement(MenuItem, filterProps(props));
};
const TwentyUiMenuItemAvatarWrapper = (
  props: MenuItemAvatarProps & { children?: React.ReactNode },
) => {
  return React.createElement(MenuItemAvatar, filterProps(props));
};
const TwentyUiMenuItemDraggableWrapper = (
  props: MenuItemDraggableProps & { children?: React.ReactNode },
) => {
  return React.createElement(MenuItemDraggable, filterProps(props));
};
const TwentyUiMenuItemHotKeysWrapper = (
  props: MenuItemHotKeysProps & { children?: React.ReactNode },
) => {
  return React.createElement(MenuItemHotKeys, filterProps(props));
};
const TwentyUiMenuItemNavigateWrapper = (
  props: MenuItemNavigateProps & { children?: React.ReactNode },
) => {
  return React.createElement(MenuItemNavigate, filterProps(props));
};
const TwentyUiMenuItemSuggestionWrapper = (
  props: MenuItemSuggestionProps & { children?: React.ReactNode },
) => {
  return React.createElement(MenuItemSuggestion, filterProps(props));
};
const TwentyUiMenuItemToggleWrapper = (
  props: MenuItemToggleProps & { children?: React.ReactNode },
) => {
  return React.createElement(MenuItemToggle, filterProps(props));
};
type ComponentRegistryValue =
  | ReturnType<typeof createRemoteComponentRenderer>
  | typeof RemoteFragmentRenderer;

export const componentRegistry: Map<string, ComponentRegistryValue> = new Map([
  ['html-div', createRemoteComponentRenderer(HtmlDivWrapper)],
  ['html-span', createRemoteComponentRenderer(HtmlSpanWrapper)],
  ['html-section', createRemoteComponentRenderer(HtmlSectionWrapper)],
  ['html-article', createRemoteComponentRenderer(HtmlArticleWrapper)],
  ['html-header', createRemoteComponentRenderer(HtmlHeaderWrapper)],
  ['html-footer', createRemoteComponentRenderer(HtmlFooterWrapper)],
  ['html-main', createRemoteComponentRenderer(HtmlMainWrapper)],
  ['html-nav', createRemoteComponentRenderer(HtmlNavWrapper)],
  ['html-aside', createRemoteComponentRenderer(HtmlAsideWrapper)],
  ['html-p', createRemoteComponentRenderer(HtmlPWrapper)],
  ['html-h1', createRemoteComponentRenderer(HtmlH1Wrapper)],
  ['html-h2', createRemoteComponentRenderer(HtmlH2Wrapper)],
  ['html-h3', createRemoteComponentRenderer(HtmlH3Wrapper)],
  ['html-h4', createRemoteComponentRenderer(HtmlH4Wrapper)],
  ['html-h5', createRemoteComponentRenderer(HtmlH5Wrapper)],
  ['html-h6', createRemoteComponentRenderer(HtmlH6Wrapper)],
  ['html-strong', createRemoteComponentRenderer(HtmlStrongWrapper)],
  ['html-em', createRemoteComponentRenderer(HtmlEmWrapper)],
  ['html-small', createRemoteComponentRenderer(HtmlSmallWrapper)],
  ['html-code', createRemoteComponentRenderer(HtmlCodeWrapper)],
  ['html-pre', createRemoteComponentRenderer(HtmlPreWrapper)],
  ['html-blockquote', createRemoteComponentRenderer(HtmlBlockquoteWrapper)],
  ['html-a', createRemoteComponentRenderer(HtmlAWrapper)],
  ['html-img', createRemoteComponentRenderer(HtmlImgWrapper)],
  ['html-ul', createRemoteComponentRenderer(HtmlUlWrapper)],
  ['html-ol', createRemoteComponentRenderer(HtmlOlWrapper)],
  ['html-li', createRemoteComponentRenderer(HtmlLiWrapper)],
  ['html-form', createRemoteComponentRenderer(HtmlFormWrapper)],
  ['html-label', createRemoteComponentRenderer(HtmlLabelWrapper)],
  ['html-input', createRemoteComponentRenderer(HtmlInputWrapper)],
  ['html-textarea', createRemoteComponentRenderer(HtmlTextareaWrapper)],
  ['html-select', createRemoteComponentRenderer(HtmlSelectWrapper)],
  ['html-option', createRemoteComponentRenderer(HtmlOptionWrapper)],
  ['html-button', createRemoteComponentRenderer(HtmlButtonWrapper)],
  ['html-table', createRemoteComponentRenderer(HtmlTableWrapper)],
  ['html-thead', createRemoteComponentRenderer(HtmlTheadWrapper)],
  ['html-tbody', createRemoteComponentRenderer(HtmlTbodyWrapper)],
  ['html-tfoot', createRemoteComponentRenderer(HtmlTfootWrapper)],
  ['html-tr', createRemoteComponentRenderer(HtmlTrWrapper)],
  ['html-th', createRemoteComponentRenderer(HtmlThWrapper)],
  ['html-td', createRemoteComponentRenderer(HtmlTdWrapper)],
  ['html-br', createRemoteComponentRenderer(HtmlBrWrapper)],
  ['html-hr', createRemoteComponentRenderer(HtmlHrWrapper)],
  [
    'twenty-ui-animated-button',
    createRemoteComponentRenderer(TwentyUiAnimatedButtonWrapper),
  ],
  [
    'twenty-ui-animated-light-icon-button',
    createRemoteComponentRenderer(TwentyUiAnimatedLightIconButtonWrapper),
  ],
  ['twenty-ui-button', createRemoteComponentRenderer(TwentyUiButtonWrapper)],
  [
    'twenty-ui-button-group',
    createRemoteComponentRenderer(TwentyUiButtonGroupWrapper),
  ],
  [
    'twenty-ui-floating-button',
    createRemoteComponentRenderer(TwentyUiFloatingButtonWrapper),
  ],
  [
    'twenty-ui-floating-button-group',
    createRemoteComponentRenderer(TwentyUiFloatingButtonGroupWrapper),
  ],
  [
    'twenty-ui-floating-icon-button',
    createRemoteComponentRenderer(TwentyUiFloatingIconButtonWrapper),
  ],
  [
    'twenty-ui-floating-icon-button-group',
    createRemoteComponentRenderer(TwentyUiFloatingIconButtonGroupWrapper),
  ],
  [
    'twenty-ui-inside-button',
    createRemoteComponentRenderer(TwentyUiInsideButtonWrapper),
  ],
  [
    'twenty-ui-light-button',
    createRemoteComponentRenderer(TwentyUiLightButtonWrapper),
  ],
  [
    'twenty-ui-light-icon-button',
    createRemoteComponentRenderer(TwentyUiLightIconButtonWrapper),
  ],
  [
    'twenty-ui-light-icon-button-group',
    createRemoteComponentRenderer(TwentyUiLightIconButtonGroupWrapper),
  ],
  [
    'twenty-ui-tab-content',
    createRemoteComponentRenderer(TwentyUiTabContentWrapper),
  ],
  [
    'twenty-ui-core-editor-header',
    createRemoteComponentRenderer(TwentyUiCoreEditorHeaderWrapper),
  ],
  [
    'twenty-ui-color-scheme-card',
    createRemoteComponentRenderer(TwentyUiColorSchemeCardWrapper),
  ],
  [
    'twenty-ui-color-scheme-picker',
    createRemoteComponentRenderer(TwentyUiColorSchemePickerWrapper),
  ],
  ['twenty-ui-radio', createRemoteComponentRenderer(TwentyUiRadioWrapper)],
  [
    'twenty-ui-search-input',
    createRemoteComponentRenderer(TwentyUiSearchInputWrapper),
  ],
  ['twenty-ui-toggle', createRemoteComponentRenderer(TwentyUiToggleWrapper)],
  [
    'twenty-ui-avatar-chip',
    createRemoteComponentRenderer(TwentyUiAvatarChipWrapper),
  ],
  [
    'twenty-ui-multiple-avatar-chip',
    createRemoteComponentRenderer(TwentyUiMultipleAvatarChipWrapper),
  ],
  ['twenty-ui-chip', createRemoteComponentRenderer(TwentyUiChipWrapper)],
  [
    'twenty-ui-link-chip',
    createRemoteComponentRenderer(TwentyUiLinkChipWrapper),
  ],
  ['twenty-ui-avatar', createRemoteComponentRenderer(TwentyUiAvatarWrapper)],
  [
    'twenty-ui-avatar-group',
    createRemoteComponentRenderer(TwentyUiAvatarGroupWrapper),
  ],
  [
    'twenty-ui-side-panel-information-banner',
    createRemoteComponentRenderer(TwentyUiSidePanelInformationBannerWrapper),
  ],
  [
    'twenty-ui-animated-checkmark',
    createRemoteComponentRenderer(TwentyUiAnimatedCheckmarkWrapper),
  ],
  [
    'twenty-ui-checkmark',
    createRemoteComponentRenderer(TwentyUiCheckmarkWrapper),
  ],
  [
    'twenty-ui-color-sample',
    createRemoteComponentRenderer(TwentyUiColorSampleWrapper),
  ],
  ['twenty-ui-info', createRemoteComponentRenderer(TwentyUiInfoWrapper)],
  [
    'twenty-ui-app-tooltip',
    createRemoteComponentRenderer(TwentyUiAppTooltipWrapper),
  ],
  [
    'twenty-ui-progress-bar',
    createRemoteComponentRenderer(TwentyUiProgressBarWrapper),
  ],
  [
    'twenty-ui-menu-picker',
    createRemoteComponentRenderer(TwentyUiMenuPickerWrapper),
  ],
  [
    'twenty-ui-menu-item',
    createRemoteComponentRenderer(TwentyUiMenuItemWrapper),
  ],
  [
    'twenty-ui-menu-item-avatar',
    createRemoteComponentRenderer(TwentyUiMenuItemAvatarWrapper),
  ],
  [
    'twenty-ui-menu-item-draggable',
    createRemoteComponentRenderer(TwentyUiMenuItemDraggableWrapper),
  ],
  [
    'twenty-ui-menu-item-hot-keys',
    createRemoteComponentRenderer(TwentyUiMenuItemHotKeysWrapper),
  ],
  [
    'twenty-ui-menu-item-navigate',
    createRemoteComponentRenderer(TwentyUiMenuItemNavigateWrapper),
  ],
  [
    'twenty-ui-menu-item-suggestion',
    createRemoteComponentRenderer(TwentyUiMenuItemSuggestionWrapper),
  ],
  [
    'twenty-ui-menu-item-toggle',
    createRemoteComponentRenderer(TwentyUiMenuItemToggleWrapper),
  ],
  ['remote-fragment', RemoteFragmentRenderer],
]);
