import { type DraggableProvided } from '@hello-pangea/dnd';

import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type FieldsConfigurationFieldItem } from '@/page-layout/types/FieldsConfiguration';
import { IconEye, IconEyeOff, useIcons } from 'twenty-ui/display';
import { MenuItemDraggable } from 'twenty-ui/navigation';

type FieldsConfigurationFieldEditorProps = {
  field: FieldsConfigurationFieldItem;
  fieldMetadata: FieldMetadataItem;
  index: number;
  onToggleVisibility: () => void;
  draggableProvided: DraggableProvided;
  isDragging: boolean;
};

export const FieldsConfigurationFieldEditor = ({
  field,
  fieldMetadata,
  onToggleVisibility,
  draggableProvided,
}: FieldsConfigurationFieldEditorProps) => {
  const { getIcon } = useIcons();
  const isVisible = field.conditionalDisplay !== false;
  const FieldIcon = getIcon(fieldMetadata.icon);

  return (
    <div
      ref={draggableProvided.innerRef}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...draggableProvided.draggableProps}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...draggableProvided.dragHandleProps}
      style={{
        ...draggableProvided.draggableProps.style,
        left: 'auto',
        top: 'auto',
      }}
    >
      <MenuItemDraggable
        LeftIcon={FieldIcon}
        text={fieldMetadata.label}
        showGrip
        isIconDisplayedOnHoverOnly={false}
        iconButtons={[
          {
            Icon: isVisible ? IconEye : IconEyeOff,
            onClick: (e) => {
              e.stopPropagation();
              onToggleVisibility();
            },
          },
        ]}
      />
    </div>
  );
};
