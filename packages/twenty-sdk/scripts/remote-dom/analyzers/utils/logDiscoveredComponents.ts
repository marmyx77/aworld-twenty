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
  console.log(`  Found ${discoveredComponents.length} components to analyze`);

  for (const discoveredComponent of discoveredComponents) {
    const propertyCount = Object.keys(discoveredComponent.properties).length;
    const eventCount = discoveredComponent.events.length;
    const slotCount = discoveredComponent.slots.length;

    const eventSummary =
      eventCount > 0
        ? `, ${eventCount} events: [${discoveredComponent.events.join(', ')}]`
        : '';
    const slotSummary =
      slotCount > 0
        ? `, ${slotCount} slots: [${discoveredComponent.slots.join(', ')}]`
        : '';
    console.log(
      `    ${discoveredComponent.componentImport} -> ${discoveredComponent.tag} (${propertyCount} props${eventSummary}${slotSummary})`,
    );
  }
};
