import { EVENT_TO_REACT } from '@/sdk/front-component-common/EventToReact';

export const eventToReactProp = (eventName: string): string => {
  return (
    EVENT_TO_REACT[eventName] ??
    `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`
  );
};
