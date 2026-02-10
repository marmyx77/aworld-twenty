import chalk from 'chalk';

const SEPARATOR_WIDTH = 60;

export const logSeparator = (): void => {
  console.log('');
  console.log(chalk.gray('─'.repeat(SEPARATOR_WIDTH)));
  console.log('');
};

export const logTitle = (text: string): void => {
  console.log('');
  console.log(chalk.bold.white(`  ${text}`));
  console.log('');
  console.log(chalk.gray('─'.repeat(SEPARATOR_WIDTH)));
  console.log('');
};

export const logSectionHeader = (text: string): void => {
  console.log(chalk.bold.white(`  ${text}`));
  console.log('');
};

export const logCategory = (name: string): void => {
  console.log(chalk.green('  ▸ ') + chalk.green.bold(name));
};

export const logSubItem = (label: string, value: string): void => {
  console.log(
    chalk.gray('    ') +
      chalk.green(label) +
      chalk.gray(' -> ') +
      chalk.white(value),
  );
};

const pluralize = (count: number, singular: string, plural: string): string =>
  count === 1 ? singular : plural;

export const logCount = (
  label: string,
  count: number,
  singularUnit: string,
  pluralUnit?: string,
): void => {
  const unit = pluralize(count, singularUnit, pluralUnit ?? singularUnit + 's');
  console.log(
    chalk.green(`  ${label}  `) +
      chalk.white.bold(`${count}`) +
      chalk.gray(` ${unit}`),
  );
};

export const logDetail = (text: string): void => {
  console.log(chalk.gray(`    ${text}`));
};

export const logDimText = (text: string): void => {
  console.log(chalk.gray(text));
};

export const logFileWritten = (filePath: string): void => {
  console.log(chalk.green('  ✓ ') + chalk.gray(filePath));
};

export const logGroupLabel = (text: string): void => {
  console.log(chalk.green(`  ${text}`));
};

export const logSuccess = (message: string, detail?: string): void => {
  const detailSuffix = detail ? chalk.gray(` ${detail}`) : '';

  console.log(chalk.green(`  ✔ `) + chalk.green.bold(message) + detailSuffix);
};

export const logError = (message: string, error?: unknown): void => {
  console.error(chalk.red.bold(`  ✖ ${message}`), error ?? '');
};

export const logWarning = (message: string): void => {
  console.warn(chalk.yellow(`  ${message}`));
};

export const logEmpty = (): void => {
  console.log('');
};

export const logCountInline = (
  count: number,
  singularUnit: string,
  pluralUnit?: string,
  prefix?: string,
): string => {
  const unit = pluralize(count, singularUnit, pluralUnit ?? singularUnit + 's');
  const prefixText = prefix ? chalk.gray(`${prefix} `) : '';

  return prefixText + chalk.white.bold(`${count}`) + chalk.gray(` ${unit}`);
};

export const formatProps = (count: number): string =>
  chalk.green(`${count} ${pluralize(count, 'prop', 'props')}`);

export const formatEvents = (count: number, names: string[]): string =>
  chalk.yellow(`${count} ${pluralize(count, 'event', 'events')}`) +
  chalk.gray(` [${names.join(', ')}]`);

export const formatSlots = (count: number, names: string[]): string =>
  chalk.magenta(`${count} ${pluralize(count, 'slot', 'slots')}`) +
  chalk.gray(` [${names.join(', ')}]`);
