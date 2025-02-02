import { DetectionModel } from '@/types/detection';

interface ModelOption {
  id: DetectionModel;
  name: string;
  description: string;
  isAvailable: boolean;
}

interface ModelSelectorProps {
  models: ModelOption[];
  activeModel: DetectionModel;
  onSelect: (model: DetectionModel) => void;
  isLoading: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  activeModel,
  onSelect,
  isLoading
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Select Model</h3>
      <div className="grid gap-2">
        {models.map(model => (
          <button
            key={model.id}
            onClick={() => onSelect(model.id)}
            disabled={isLoading || !model.isAvailable}
            className={`p-2 rounded text-left ${
              activeModel === model.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600'
            } ${!model.isAvailable && 'opacity-50 cursor-not-allowed'}`}
          >
            <div className="font-medium">{model.name}</div>
            <div className="text-sm opacity-75">{model.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}; 