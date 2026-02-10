import chalk from 'chalk';

import {
  formatEvents,
  formatProps,
  formatSlots,
  logCountInline,
  logDimText,
} from '../../utils/logger';

type ComponentSummary = {
  tag: string;
  componentImport: string;
  properties: Record<string, unknown>;
  events: string[];
  slots: string[];
};

export const logDiscoveredComponents = (
  discoveredComponents: ComponentSummary[],
): void => {
  if (discoveredComponents.length === 0) {
    logDimText('    No components found');

    return;
  }

  console.log(
    '    ' +
      logCountInline(
        discoveredComponents.length,
        'component found',
        'components found',
      ),
  );

  for (const discoveredComponent of discoveredComponents) {
    const propertyCount = Object.keys(discoveredComponent.properties).length;
    const eventCount = discoveredComponent.events.length;
    const slotCount = discoveredComponent.slots.length;

    const parts: string[] = [formatProps(propertyCount)];

    if (eventCount > 0) {
      parts.push(formatEvents(eventCount, discoveredComponent.events));
    }

    if (slotCount > 0) {
      parts.push(formatSlots(slotCount, discoveredComponent.slots));
    }

    console.log(
      chalk.green('      · ') +
        chalk.green(discoveredComponent.componentImport) +
        chalk.gray(' -> ') +
        chalk.white(discoveredComponent.tag) +
        chalk.gray(' (') +
        parts.join(chalk.green(', ')) +
        chalk.gray(')'),
    );
  }
};
