import { t } from '@lingui/core/macro';

import { isNonEmptyString } from '@sniptt/guards';

import { type ToolInput } from '@/ai/types/ToolInput';
import { isDefined } from 'twenty-shared/utils';

const extractSearchQuery = (input: ToolInput): string => {
  if (!input) {
    return '';
  }

  if (
    typeof input === 'object' &&
    'query' in input &&
    typeof input.query === 'string'
  ) {
    return input.query;
  }

  if (
    typeof input === 'object' &&
    'action' in input &&
    isDefined(input.action) &&
    typeof input.action === 'object' &&
    'query' in input.action &&
    typeof input.action.query === 'string'
  ) {
    return input.action.query;
  }

  return '';
};

const extractCustomLoadingMessage = (input: ToolInput): string | null => {
  if (
    isDefined(input) &&
    typeof input === 'object' &&
    'loadingMessage' in input &&
    typeof input.loadingMessage === 'string'
  ) {
    return input.loadingMessage;
  }

  return null;
};

export const resolveToolInput = (
  input: ToolInput,
  toolName: string,
): { resolvedInput: ToolInput; resolvedToolName: string } => {
  if (
    toolName === 'execute_tool' &&
    isDefined(input) &&
    typeof input === 'object' &&
    'toolName' in input &&
    'arguments' in input
  ) {
    return {
      resolvedInput: input.arguments as ToolInput,
      resolvedToolName: String(input.toolName),
    };
  }

  return { resolvedInput: input, resolvedToolName: toolName };
};

const extractLearnToolNames = (input: ToolInput): string => {
  if (
    isDefined(input) &&
    typeof input === 'object' &&
    'toolNames' in input &&
    Array.isArray(input.toolNames)
  ) {
    return input.toolNames.join(', ');
  }

  return '';
};

const extractSkillNames = (input: ToolInput): string => {
  if (
    isDefined(input) &&
    typeof input === 'object' &&
    'skillNames' in input &&
    Array.isArray(input.skillNames)
  ) {
    return input.skillNames.join(', ');
  }

  return '';
};

const formatToolName = (toolName: string): string => {
  return toolName.replace(/_/g, ' ');
};

export const getToolDisplayMessage = (
  input: ToolInput,
  toolName: string,
  isFinished?: boolean,
): string => {
  const { resolvedInput, resolvedToolName } = resolveToolInput(input, toolName);

  if (resolvedToolName === 'web_search') {
    const query = extractSearchQuery(resolvedInput);

    if (isNonEmptyString(query)) {
      return isFinished
        ? t`Searched the web for '${query}'`
        : t`Searching the web for '${query}'`;
    }

    return isFinished ? t`Searched the web` : t`Searching the web`;
  }

  if (resolvedToolName === 'learn_tools') {
    const names = extractLearnToolNames(resolvedInput);

    if (isNonEmptyString(names)) {
      return isFinished ? t`Learned ${names}` : t`Learning ${names}`;
    }

    return isFinished ? t`Learned tools` : t`Learning tools...`;
  }

  if (resolvedToolName === 'load_skills') {
    const names = extractSkillNames(resolvedInput);

    if (isNonEmptyString(names)) {
      return isFinished ? t`Loaded ${names}` : t`Loading ${names}`;
    }

    return isFinished ? t`Loaded skills` : t`Loading skills...`;
  }

  const customMessage = extractCustomLoadingMessage(resolvedInput);

  if (isDefined(customMessage)) {
    return customMessage;
  }

  const formattedName = formatToolName(resolvedToolName);

  return isFinished ? t`Ran ${formattedName}` : t`Running ${formattedName}`;
};
