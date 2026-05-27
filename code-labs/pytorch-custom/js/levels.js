// ============================================================
// LEVELS — 8 Lessons across 3 Chapters with X-Ray / Assemble / Rewire rounds
// ============================================================

export const LEVELS = [
  // ================================================================
  // CHAPTER 1: Custom Modules
  // ================================================================

  // LESSON 1: nn.Module Class
  {
    id: 'nn_module_class',
    name: 'nn.Module Class',
    chapter: 0,
    description: 'Build a model by subclassing nn.Module.',
    tracer: [
      { text: 'nn.Module is the base class for all models.', viz: 'module_base' },
      { text: '__init__ defines the layers.', viz: 'module_init' },
      { text: 'forward() wires them together.', viz: 'module_forward' },
      { text: 'Call it like a function to get output.', viz: 'module_call' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      '',
      'class MyModel(nn.Module):',
      '    def __init__(self):',
      '        super().__init__()',
      '        self.fc1 = nn.Linear(784, 128)',
      '        self.relu = nn.ReLU()',
      '        self.fc2 = nn.Linear(128, 10)',
      '',
      '    def forward(self, x):',
      '        x = self.fc1(x)',
      '        x = self.relu(x)',
      '        x = self.fc2(x)',
      '        return x',
      '',
      'model = MyModel()',
      'output = model(torch.rand(784))',
    ],

    xray: {
      pipeline: ['imports', 'class\ndefinition', '__init__\nlayers', 'forward\npass', 'use\nmodel'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'We need torch for tensors and nn for building neural network layers.',
          deepDive: 'torch gives you tensor math, nn gives you building blocks like layers and activations. Nearly every PyTorch model file starts with both.',
          deeperDive: 'torch provides the core tensor data structure and operations (creation, math, reshaping, GPU transfer). torch.nn provides the Module base class, all standard layers (Linear, Conv2d, LSTM), activations (ReLU, Sigmoid), loss functions (CrossEntropyLoss), and containers (Sequential). When you subclass nn.Module, you inherit automatic parameter tracking, GPU movement via .to(device), serialization via state_dict(), and the ability to nest modules inside each other.',
          options: ['Import libraries', 'Define model class', 'Set up layers', 'Run the model'],
        },
        {
          startLine: 3,
          endLine: 8,
          color: 'XRAY_MODEL',
          correctLabel: 'Define layers in __init__',
          explanation: 'The class inherits nn.Module. __init__ registers layers as attributes so PyTorch tracks their weights.',
          deepDive: 'super().__init__() activates all the plumbing from nn.Module. Then each layer you assign as self.something gets automatically registered so PyTorch can find and update its weights during training.',
          deeperDive: 'When you call super().__init__(), the nn.Module base class sets up internal dictionaries (_parameters, _modules, _buffers) that track everything the model owns. Any nn.Module assigned as an attribute (like self.fc1 = nn.Linear(...)) is automatically registered in _modules, which means model.parameters() will include its weights, model.to("cuda") will move them to GPU, and model.state_dict() will serialize them. If you forget super().__init__(), these dictionaries do not exist and PyTorch raises an error. The convention is to define all layers in __init__ and wire them in forward().',
          options: ['Define layers in __init__', 'Wire the forward pass', 'Import libraries', 'Instantiate the model'],
        },
        {
          startLine: 10,
          endLine: 14,
          color: 'XRAY_PREDICT',
          correctLabel: 'Wire the forward pass',
          explanation: 'forward() defines the computation: data flows through fc1, ReLU, then fc2.',
          deepDive: 'Think of forward() as the recipe. The ingredients (layers) were defined in __init__, and forward() tells PyTorch what order to use them in when data arrives.',
          deeperDive: 'forward() is called automatically when you do model(input) -- Python calls model.__call__(input), which internally calls self.forward(input) plus pre/post hooks and gradient tracking. Inside forward() you can use any Python control flow: if statements, for loops, even different paths for training vs evaluation. This flexibility is the main advantage of nn.Module over nn.Sequential. The input x is transformed step by step: [784] -> fc1 -> [128] -> relu -> [128] -> fc2 -> [10]. Each line overwrites x with the next transformation.',
          options: ['Wire the forward pass', 'Define layers in __init__', 'Import libraries', 'Create training loop'],
        },
        {
          startLine: 16,
          endLine: 17,
          color: 'XRAY_TRAIN',
          correctLabel: 'Instantiate and use model',
          explanation: 'MyModel() creates the model. Calling model(input) runs the forward pass and returns output.',
          deepDive: 'Creating the model allocates all the weight matrices. Passing data through it with model(input) runs the entire forward() chain and gives you the 10-class output scores.',
          deeperDive: 'MyModel() triggers __init__(), which allocates all weight tensors with random initialization (Kaiming uniform by default for Linear layers). At this point model.parameters() returns 4 tensors: fc1.weight [128, 784], fc1.bias [128], fc2.weight [10, 128], fc2.bias [10]. Calling model(torch.rand(784)) triggers forward(), producing a tensor of shape [10]. You never call model.forward(x) directly -- always use model(x) so that hooks and gradient tracking work correctly.',
          options: ['Instantiate and use model', 'Define layers in __init__', 'Wire the forward pass', 'Import libraries'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'imports',
          code: 'import torch\nimport torch.nn as nn',
          lines: [0, 1],
        },
        {
          id: 'class_init',
          code: 'class MyModel(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.fc1 = nn.Linear(784, 128)\n        self.relu = nn.ReLU()\n        self.fc2 = nn.Linear(128, 10)',
          lines: [3, 4, 5, 6, 7, 8],
        },
        {
          id: 'forward',
          code: '    def forward(self, x):\n        x = self.fc1(x)\n        x = self.relu(x)\n        x = self.fc2(x)\n        return x',
          lines: [10, 11, 12, 13, 14],
        },
        {
          id: 'use',
          code: 'model = MyModel()\noutput = model(torch.rand(784))',
          lines: [16, 17],
        },
      ],
    },

    rewire: {
      goal: 'Add a hidden layer of 256 neurons',
      targets: [
        {
          line: 6,
          description: 'Change the first layer output size',
          currentCode: '        self.fc1 = nn.Linear(784, 128)',
          options: [
            { label: 'nn.Linear(784, 256)', newCode: '        self.fc1 = nn.Linear(784, 256)', correct: true },
            { label: 'nn.Linear(784, 64)', newCode: '        self.fc1 = nn.Linear(784, 64)', correct: false },
            { label: 'nn.Linear(256, 128)', newCode: '        self.fc1 = nn.Linear(256, 128)', correct: false },
          ],
        },
        {
          line: 8,
          description: 'Update second layer input to match',
          currentCode: '        self.fc2 = nn.Linear(128, 10)',
          options: [
            { label: 'nn.Linear(256, 10)', newCode: '        self.fc2 = nn.Linear(256, 10)', correct: true },
            { label: 'nn.Linear(128, 10)', newCode: '        self.fc2 = nn.Linear(128, 10)', correct: false },
            { label: 'nn.Linear(256, 256)', newCode: '        self.fc2 = nn.Linear(256, 256)', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 2: Multiple Inputs
  {
    id: 'multiple_inputs',
    name: 'Multiple Inputs',
    chapter: 0,
    description: 'Handle two input branches with torch.cat.',
    tracer: [
      { text: 'Some models take multiple inputs.', viz: 'multi_branches' },
      { text: 'Each branch processes its own data.', viz: 'multi_process' },
      { text: 'torch.cat joins them together.', viz: 'multi_cat' },
      { text: 'A shared head produces the final output.', viz: 'multi_head' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      '',
      'class TwoInputModel(nn.Module):',
      '    def __init__(self):',
      '        super().__init__()',
      '        self.branch_a = nn.Linear(100, 64)',
      '        self.branch_b = nn.Linear(50, 64)',
      '        self.head = nn.Linear(128, 10)',
      '',
      '    def forward(self, x_a, x_b):',
      '        a = torch.relu(self.branch_a(x_a))',
      '        b = torch.relu(self.branch_b(x_b))',
      '        merged = torch.cat([a, b], dim=-1)',
      '        return self.head(merged)',
    ],

    xray: {
      pipeline: ['imports', 'branches', 'head\nlayer', 'forward\nmerge'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensor operations, nn for neural network modules.',
          deepDive: 'Same two imports as always. torch.relu is a functional version of nn.ReLU -- you can call it directly in forward() without defining it in __init__.',
          deeperDive: 'PyTorch offers two ways to use activations: the module version nn.ReLU() (defined in __init__, used in forward) and the functional version torch.relu() (called directly in forward). The functional version is stateless -- it has no parameters to track, so there is no need to register it. For simple activations like ReLU, both approaches are equivalent. The functional style (torch.relu, torch.sigmoid, torch.nn.functional.softmax) is common in custom Module classes because it keeps __init__ shorter.',
          options: ['Import libraries', 'Define branch layers', 'Create the head', 'Merge branches'],
        },
        {
          startLine: 3,
          endLine: 8,
          color: 'XRAY_MODEL',
          correctLabel: 'Define two branches + head',
          explanation: 'branch_a takes 100 inputs, branch_b takes 50. Both output 64. head takes 128 (64+64) and outputs 10.',
          deepDive: 'Each branch is like a separate specialist: one reads 100 features, the other reads 50. Both compress to 64. The head layer takes the combined 128 features and makes the final decision.',
          deeperDive: 'The key design principle is that the head layer input size must equal the sum of all branch outputs: 64 + 64 = 128. If you add a third branch outputting 32 features, the head would need nn.Linear(160, 10). This pattern is called a multi-input or multi-branch architecture. Real-world examples include models that combine image features (from a CNN branch) with text features (from an LSTM branch), or models that fuse tabular data with image data. Each branch can have completely different architectures tailored to its input type.',
          options: ['Define two branches + head', 'Import libraries', 'Merge branches in forward', 'Run the model'],
        },
        {
          startLine: 10,
          endLine: 14,
          color: 'XRAY_PREDICT',
          correctLabel: 'Merge branches in forward',
          explanation: 'Each branch processes its input, then torch.cat joins them along the last dimension before the head.',
          deepDive: 'branch_a and branch_b each transform their input to 64 features. torch.cat glues these two 64-vectors into one 128-vector. Then the head layer maps 128 features to 10 output scores.',
          deeperDive: 'torch.cat([a, b], dim=-1) concatenates tensors along the last dimension. For 1D tensors of shape [64] each, the result is shape [128]. For batched inputs of shape [batch, 64], the result is [batch, 128]. dim=-1 means "the last axis," which is equivalent to dim=1 for 2D tensors. An alternative to concatenation is addition (a + b), which requires both tensors to have the same shape and produces a tensor of the same size rather than doubling it. Concatenation preserves all information from both branches; addition loses some by merging dimensions.',
          options: ['Merge branches in forward', 'Define two branches + head', 'Import libraries', 'Train the model'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'imports',
          code: 'import torch\nimport torch.nn as nn',
          lines: [0, 1],
        },
        {
          id: 'class_init',
          code: 'class TwoInputModel(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.branch_a = nn.Linear(100, 64)\n        self.branch_b = nn.Linear(50, 64)\n        self.head = nn.Linear(128, 10)',
          lines: [3, 4, 5, 6, 7, 8],
        },
        {
          id: 'forward',
          code: '    def forward(self, x_a, x_b):\n        a = torch.relu(self.branch_a(x_a))\n        b = torch.relu(self.branch_b(x_b))\n        merged = torch.cat([a, b], dim=-1)\n        return self.head(merged)',
          lines: [10, 11, 12, 13, 14],
        },
      ],
    },

    rewire: {
      goal: 'Make both branches accept 200 inputs',
      targets: [
        {
          line: 6,
          description: 'Change branch_a input size',
          currentCode: '        self.branch_a = nn.Linear(100, 64)',
          options: [
            { label: 'nn.Linear(200, 64)', newCode: '        self.branch_a = nn.Linear(200, 64)', correct: true },
            { label: 'nn.Linear(100, 128)', newCode: '        self.branch_a = nn.Linear(100, 128)', correct: false },
            { label: 'nn.Linear(200, 200)', newCode: '        self.branch_a = nn.Linear(200, 200)', correct: false },
          ],
        },
        {
          line: 7,
          description: 'Change branch_b input size',
          currentCode: '        self.branch_b = nn.Linear(50, 64)',
          options: [
            { label: 'nn.Linear(200, 64)', newCode: '        self.branch_b = nn.Linear(200, 64)', correct: true },
            { label: 'nn.Linear(50, 128)', newCode: '        self.branch_b = nn.Linear(50, 128)', correct: false },
            { label: 'nn.Linear(100, 64)', newCode: '        self.branch_b = nn.Linear(100, 64)', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 3: Custom Loss
  {
    id: 'custom_loss',
    name: 'Custom Loss',
    chapter: 0,
    description: 'Write your own loss function as an nn.Module.',
    tracer: [
      { text: 'Standard losses work for most tasks.', viz: 'loss_standard' },
      { text: 'Custom losses let you add domain knowledge.', viz: 'loss_custom' },
      { text: 'WeightedMSE penalizes large errors more.', viz: 'loss_weighted' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      '',
      'class WeightedMSE(nn.Module):',
      '    def __init__(self, weight=2.0):',
      '        super().__init__()',
      '        self.weight = weight',
      '',
      '    def forward(self, pred, target):',
      '        error = pred - target',
      '        return (self.weight * error ** 2).mean()',
      '',
      'loss_fn = WeightedMSE(weight=3.0)',
      'loss = loss_fn(predictions, targets)',
    ],

    xray: {
      pipeline: ['imports', 'class\n__init__', 'forward\ncompute', 'usage'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for math operations, nn for the Module base class.',
          deepDive: 'Even custom loss functions inherit from nn.Module, which lets them have learnable parameters if needed and integrates cleanly with the rest of PyTorch.',
          deeperDive: 'By subclassing nn.Module for a loss function, you get the same benefits as with models: parameter tracking, serialization, device management, and a clean callable interface. While this simple WeightedMSE has no learnable parameters (self.weight is a plain float, not a nn.Parameter), you could make it learnable by wrapping it: self.weight = nn.Parameter(torch.tensor(2.0)). Then the optimizer would adjust the weight during training alongside the model weights.',
          options: ['Import libraries', 'Define the loss class', 'Compute the loss', 'Use the loss'],
        },
        {
          startLine: 3,
          endLine: 6,
          color: 'XRAY_MODEL',
          correctLabel: 'Define loss with weight param',
          explanation: 'WeightedMSE stores a weight factor in __init__ that scales the squared error.',
          deepDive: 'The weight parameter lets you control how aggressively the loss penalizes errors. A weight of 3.0 means errors are punished three times harder than standard MSE.',
          deeperDive: 'Standard MSE loss computes mean((pred - target)^2). Adding a weight multiplier changes it to mean(weight * (pred - target)^2). This is useful when some errors matter more than others. For example, in a medical application, you might want to penalize false negatives much more than false positives. The weight here is a hyperparameter set at construction time. You could also pass per-sample weights in forward() to weight individual predictions differently.',
          options: ['Define loss with weight param', 'Import libraries', 'Compute the error', 'Use the loss function'],
        },
        {
          startLine: 8,
          endLine: 10,
          color: 'XRAY_PREDICT',
          correctLabel: 'Compute weighted squared error',
          explanation: 'forward() calculates (pred - target), squares it, multiplies by weight, and takes the mean.',
          deepDive: 'The error is the gap between prediction and target. Squaring it makes all errors positive and punishes big mistakes more. Multiplying by weight amplifies the penalty, and .mean() averages across all samples.',
          deeperDive: 'The operation self.weight * error ** 2 applies element-wise: if pred and target have shape [batch_size], the result is a tensor of the same shape with each element being weight * (pred_i - target_i)^2. The .mean() call reduces this to a single scalar, which is required for loss.backward() to work (backprop needs a scalar to differentiate). You could use .sum() instead of .mean(), but mean is preferred because the gradient magnitude does not depend on batch size, making learning rate tuning easier.',
          options: ['Compute weighted squared error', 'Define loss with weight param', 'Import libraries', 'Instantiate the loss'],
        },
        {
          startLine: 12,
          endLine: 13,
          color: 'XRAY_TRAIN',
          correctLabel: 'Use the loss function',
          explanation: 'Create the loss with weight=3.0, then call it like any function to compute the loss value.',
          deepDive: 'Just like with a model, you create the loss object once and then call it repeatedly during training. The weight of 3.0 stays fixed throughout unless you change it manually.',
          deeperDive: 'loss_fn(predictions, targets) calls forward(predictions, targets) internally, returning a scalar tensor that carries the full computation graph. You can then call loss.backward() to compute gradients and optimizer.step() to update model weights. The loss function itself has no weights to update (unless you used nn.Parameter), so you typically do not pass its parameters to the optimizer. This pattern -- custom Module as loss -- is common in research papers that propose novel training objectives.',
          options: ['Use the loss function', 'Compute weighted squared error', 'Define loss with weight param', 'Import libraries'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'imports',
          code: 'import torch\nimport torch.nn as nn',
          lines: [0, 1],
        },
        {
          id: 'class_init',
          code: 'class WeightedMSE(nn.Module):\n    def __init__(self, weight=2.0):\n        super().__init__()\n        self.weight = weight',
          lines: [3, 4, 5, 6],
        },
        {
          id: 'forward',
          code: '    def forward(self, pred, target):\n        error = pred - target\n        return (self.weight * error ** 2).mean()',
          lines: [8, 9, 10],
        },
        {
          id: 'usage',
          code: 'loss_fn = WeightedMSE(weight=3.0)\nloss = loss_fn(predictions, targets)',
          lines: [12, 13],
        },
      ],
    },

    rewire: {
      goal: 'Use absolute error instead of squared error',
      targets: [
        {
          line: 10,
          description: 'Change squared error to absolute error',
          currentCode: '        return (self.weight * error ** 2).mean()',
          options: [
            { label: '(self.weight * error.abs()).mean()', newCode: '        return (self.weight * error.abs()).mean()', correct: true },
            { label: '(self.weight * error).mean()', newCode: '        return (self.weight * error).mean()', correct: false },
            { label: '(error ** 2).mean()', newCode: '        return (error ** 2).mean()', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 2: Regularization
  // ================================================================

  // LESSON 4: Dropout
  {
    id: 'dropout',
    name: 'Dropout',
    chapter: 1,
    description: 'Prevent overfitting by randomly dropping neurons.',
    tracer: [
      { text: 'Overfitting: the model memorizes training data.', viz: 'drop_overfit' },
      { text: 'Dropout randomly disables neurons during training.', viz: 'drop_neurons' },
      { text: 'At test time, all neurons are active.', viz: 'drop_eval' },
      { text: 'model.train() and model.eval() toggle this.', viz: 'drop_toggle' },
    ],
    code: [
      'import torch.nn as nn',
      '',
      'model = nn.Sequential(',
      '    nn.Linear(784, 256),',
      '    nn.ReLU(),',
      '    nn.Dropout(0.3),',
      '    nn.Linear(256, 128),',
      '    nn.ReLU(),',
      '    nn.Dropout(0.3),',
      '    nn.Linear(128, 10)',
      ')',
      '',
      'model.train()',
      'model.eval()',
    ],

    xray: {
      pipeline: ['import', 'layer 1\n+ drop', 'layer 2\n+ drop', 'output', 'train\n/ eval'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import nn module',
          explanation: 'torch.nn provides Dropout along with all other layer types.',
          deepDive: 'nn.Dropout is built into PyTorch just like nn.Linear and nn.ReLU. No extra imports needed beyond torch.nn.',
          deeperDive: 'nn.Dropout is one of many regularization layers in torch.nn. Others include nn.Dropout2d (for convolutional feature maps, drops entire channels), nn.AlphaDropout (for self-normalizing networks with SELU activation), and nn.DropPath (used in vision transformers). All of these behave differently during training vs evaluation mode, which is controlled by model.train() and model.eval().',
          options: ['Import nn module', 'Define model layers', 'Add dropout layers', 'Toggle train/eval mode'],
        },
        {
          startLine: 2,
          endLine: 10,
          color: 'XRAY_MODEL',
          correctLabel: 'Model with dropout layers',
          explanation: 'Dropout(0.3) randomly zeros out 30% of values after each hidden layer during training.',
          deepDive: 'Each Dropout layer acts like a random mask: 30% of the values passing through become zero. This forces the network to not rely on any single neuron, making it more robust.',
          deeperDive: 'Dropout(p=0.3) means each element has a 30% probability of being set to zero independently. The remaining 70% of values are scaled up by 1/(1-p) = 1/0.7 to keep the expected sum the same. This scaling is called inverted dropout and means no adjustment is needed at test time. Dropout is placed after activations (ReLU) because dropping a value before ReLU could just be undone by the activation. Common dropout rates are 0.1-0.5; higher rates provide stronger regularization but can hurt training if set too high. The output layer typically has no dropout because you want the full predictive power for the final scores.',
          options: ['Model with dropout layers', 'Import nn module', 'Set training mode', 'Set evaluation mode'],
        },
        {
          startLine: 12,
          endLine: 13,
          color: 'XRAY_TRAIN',
          correctLabel: 'Toggle train/eval mode',
          explanation: 'model.train() enables dropout. model.eval() disables it for inference.',
          deepDive: 'During training, dropout randomly removes neurons to prevent overfitting. During testing, you want the full network, so model.eval() turns dropout off.',
          deeperDive: 'model.train() sets every submodule to training mode, which enables dropout and makes BatchNorm use batch statistics. model.eval() switches to evaluation mode, disabling dropout and making BatchNorm use running statistics. Forgetting to call model.eval() before testing is one of the most common PyTorch bugs -- your test accuracy will be artificially low because dropout is still active. These calls are recursive: calling model.train() sets the mode for every layer inside the model, not just the top-level module.',
          options: ['Toggle train/eval mode', 'Model with dropout layers', 'Import nn module', 'Run forward pass'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'import torch.nn as nn',
          lines: [0],
        },
        {
          id: 'model',
          code: 'model = nn.Sequential(\n    nn.Linear(784, 256),\n    nn.ReLU(),\n    nn.Dropout(0.3),\n    nn.Linear(256, 128),\n    nn.ReLU(),\n    nn.Dropout(0.3),\n    nn.Linear(128, 10)\n)',
          lines: [2, 3, 4, 5, 6, 7, 8, 9, 10],
        },
        {
          id: 'mode',
          code: 'model.train()\nmodel.eval()',
          lines: [12, 13],
        },
      ],
    },

    rewire: {
      goal: 'Increase dropout rate to 50%',
      targets: [
        {
          line: 5,
          description: 'Change first dropout rate',
          currentCode: '    nn.Dropout(0.3),',
          options: [
            { label: 'nn.Dropout(0.5)', newCode: '    nn.Dropout(0.5),', correct: true },
            { label: 'nn.Dropout(0.1)', newCode: '    nn.Dropout(0.1),', correct: false },
            { label: 'nn.Dropout(1.0)', newCode: '    nn.Dropout(1.0),', correct: false },
          ],
        },
        {
          line: 8,
          description: 'Change second dropout rate',
          currentCode: '    nn.Dropout(0.3),',
          options: [
            { label: 'nn.Dropout(0.5)', newCode: '    nn.Dropout(0.5),', correct: true },
            { label: 'nn.Dropout(0.3)', newCode: '    nn.Dropout(0.3),', correct: false },
            { label: 'nn.Dropout(0.8)', newCode: '    nn.Dropout(0.8),', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 5: Batch Normalization
  {
    id: 'batch_norm',
    name: 'Batch Normalization',
    chapter: 1,
    description: 'Normalize layer inputs for faster, more stable training.',
    tracer: [
      { text: 'Inputs to each layer can drift during training.', viz: 'bn_drift' },
      { text: 'BatchNorm centers and scales each batch.', viz: 'bn_normalize' },
      { text: 'It learns optimal scale and shift.', viz: 'bn_params' },
      { text: 'Placed between linear and activation layers.', viz: 'bn_placement' },
    ],
    code: [
      'import torch.nn as nn',
      '',
      'model = nn.Sequential(',
      '    nn.Linear(784, 256),',
      '    nn.BatchNorm1d(256),',
      '    nn.ReLU(),',
      '    nn.Linear(256, 128),',
      '    nn.BatchNorm1d(128),',
      '    nn.ReLU(),',
      '    nn.Linear(128, 10)',
      ')',
    ],

    xray: {
      pipeline: ['import', 'Linear\n+ BN', 'ReLU', 'Linear\n+ BN', 'output'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import nn module',
          explanation: 'BatchNorm1d is part of torch.nn, just like Linear and ReLU.',
          deepDive: 'PyTorch provides several BatchNorm variants: BatchNorm1d for fully connected layers, BatchNorm2d for convolutional layers, and BatchNorm3d for 3D convolutions.',
          deeperDive: 'The difference between BatchNorm variants is the number of dimensions they normalize over. BatchNorm1d expects input of shape [batch, features] and normalizes over the batch dimension for each feature independently. BatchNorm2d expects [batch, channels, height, width] and normalizes over batch, height, and width for each channel. Using the wrong variant (e.g., BatchNorm2d after a Linear layer) causes a shape error.',
          options: ['Import nn module', 'Add BatchNorm layers', 'Define the model', 'Set up output layer'],
        },
        {
          startLine: 2,
          endLine: 5,
          color: 'XRAY_MODEL',
          correctLabel: 'First layer with BatchNorm',
          explanation: 'BatchNorm1d(256) normalizes the 256 outputs of the Linear layer before ReLU activation.',
          deepDive: 'After the Linear layer produces 256 numbers, BatchNorm centers them around zero and scales them to unit variance. This makes the ReLU activation work on a consistent input range every time.',
          deeperDive: 'BatchNorm1d(256) performs: output = gamma * (input - mean) / sqrt(variance + epsilon) + beta, where mean and variance are computed across the batch dimension for each of the 256 features. gamma (scale) and beta (shift) are learnable parameters initialized to 1 and 0 respectively, with 256 elements each. During training, it uses the current batch statistics. During evaluation, it uses exponentially weighted running averages accumulated during training. The epsilon (default 1e-5) prevents division by zero.',
          options: ['First layer with BatchNorm', 'Import nn module', 'Second layer with BatchNorm', 'Output layer'],
        },
        {
          startLine: 6,
          endLine: 9,
          color: 'XRAY_PREDICT',
          correctLabel: 'Second layer with BatchNorm',
          explanation: 'Same pattern: Linear -> BatchNorm -> ReLU. The BatchNorm argument matches the Linear output size.',
          deepDive: 'The pattern repeats: transform the data (Linear), normalize it (BatchNorm), then activate (ReLU). The number passed to BatchNorm must match the previous layer output -- here 128.',
          deeperDive: 'Placing BatchNorm between Linear and ReLU (pre-activation normalization) is the original placement from the BatchNorm paper. Some practitioners put it after ReLU (post-activation), which can also work well. The key constraint is that BatchNorm1d(N) must receive input with N features -- so after nn.Linear(256, 128), you need nn.BatchNorm1d(128), not 256. BatchNorm adds 2*N learnable parameters (gamma and beta) per layer, which is negligible compared to the Linear layer weights.',
          options: ['Second layer with BatchNorm', 'First layer with BatchNorm', 'Output layer', 'Import nn module'],
        },
        {
          startLine: 9,
          endLine: 9,
          color: 'XRAY_TRAIN',
          correctLabel: 'Output layer (no BatchNorm)',
          explanation: 'The final layer has no BatchNorm -- raw logits are needed for the loss function.',
          deepDive: 'The output layer produces raw scores (logits) that go straight to the loss function. Normalizing them would interfere with loss computation.',
          deeperDive: 'CrossEntropyLoss expects raw, unnormalized logits because it applies log-softmax internally. If you normalize the logits with BatchNorm, you constrain their distribution to near zero mean and unit variance, which limits the model\'s ability to express confident predictions (large positive logits for the correct class). This is why the convention is to skip BatchNorm on the final output layer. The same applies to the output layer of generative models, regression heads, and any layer whose raw values have a specific meaning.',
          options: ['Output layer (no BatchNorm)', 'Second layer with BatchNorm', 'First layer with BatchNorm', 'Import nn module'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'import torch.nn as nn',
          lines: [0],
        },
        {
          id: 'seq_start',
          code: 'model = nn.Sequential(\n    nn.Linear(784, 256),\n    nn.BatchNorm1d(256),\n    nn.ReLU(),',
          lines: [2, 3, 4, 5],
        },
        {
          id: 'layer2',
          code: '    nn.Linear(256, 128),\n    nn.BatchNorm1d(128),\n    nn.ReLU(),',
          lines: [6, 7, 8],
        },
        {
          id: 'output',
          code: '    nn.Linear(128, 10)\n)',
          lines: [9, 10],
        },
      ],
    },

    rewire: {
      goal: 'Use 512 neurons in the first hidden layer',
      targets: [
        {
          line: 3,
          description: 'Change first Linear output',
          currentCode: '    nn.Linear(784, 256),',
          options: [
            { label: 'nn.Linear(784, 512)', newCode: '    nn.Linear(784, 512),', correct: true },
            { label: 'nn.Linear(512, 256)', newCode: '    nn.Linear(512, 256),', correct: false },
            { label: 'nn.Linear(784, 128)', newCode: '    nn.Linear(784, 128),', correct: false },
          ],
        },
        {
          line: 4,
          description: 'Update BatchNorm to match',
          currentCode: '    nn.BatchNorm1d(256),',
          options: [
            { label: 'nn.BatchNorm1d(512)', newCode: '    nn.BatchNorm1d(512),', correct: true },
            { label: 'nn.BatchNorm1d(256)', newCode: '    nn.BatchNorm1d(256),', correct: false },
            { label: 'nn.BatchNorm1d(784)', newCode: '    nn.BatchNorm1d(784),', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 6: Learning Rate Scheduler
  {
    id: 'lr_scheduler',
    name: 'LR Scheduler',
    chapter: 1,
    description: 'Automatically reduce learning rate during training.',
    tracer: [
      { text: 'Learning rate controls how big each step is.', viz: 'lr_step_size' },
      { text: 'Too high: overshoots. Too low: too slow.', viz: 'lr_tradeoff' },
      { text: 'A scheduler reduces it over time.', viz: 'lr_decay' },
      { text: 'StepLR cuts the rate every N epochs.', viz: 'lr_steplr' },
    ],
    code: [
      'import torch.optim as optim',
      '',
      'optimizer = optim.SGD(model.parameters(), lr=0.1)',
      'scheduler = optim.lr_scheduler.StepLR(',
      '    optimizer, step_size=10, gamma=0.5)',
      '',
      'for epoch in range(30):',
      '    train_one_epoch(model, optimizer)',
      '    scheduler.step()',
      '    print(f"LR: {scheduler.get_last_lr()}")',
    ],

    xray: {
      pipeline: ['import', 'optimizer', 'scheduler', 'train\nloop', 'step\n+ print'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import optimizer module',
          explanation: 'torch.optim contains all optimizers (SGD, Adam) and learning rate schedulers.',
          deepDive: 'The optim module has two sections: optimizers (SGD, Adam, AdamW) that update weights, and schedulers (StepLR, CosineAnnealingLR) that adjust the learning rate over time.',
          deeperDive: 'torch.optim is organized into optimizer classes (SGD, Adam, AdamW, RMSprop) and scheduler classes under optim.lr_scheduler (StepLR, MultiStepLR, ExponentialLR, CosineAnnealingLR, ReduceLROnPlateau, OneCycleLR). Optimizers handle the weight update rule; schedulers modify the learning rate according to a schedule. They work together: the optimizer stores the current learning rate, and the scheduler modifies it. You can also use multiple schedulers simultaneously with ChainedScheduler.',
          options: ['Import optimizer module', 'Create optimizer', 'Create scheduler', 'Run training loop'],
        },
        {
          startLine: 2,
          endLine: 2,
          color: 'XRAY_MODEL',
          correctLabel: 'Create SGD optimizer',
          explanation: 'SGD with initial learning rate 0.1. The scheduler will modify this rate later.',
          deepDive: 'SGD (Stochastic Gradient Descent) is the simplest optimizer. Starting with lr=0.1 means each weight update multiplies the gradient by 0.1. The scheduler will reduce this over time.',
          deeperDive: 'optim.SGD updates weights using: w = w - lr * gradient. With lr=0.1, if a gradient is 0.5, the weight changes by 0.05. SGD with a high initial learning rate and a scheduler often outperforms Adam for image classification tasks, especially with longer training. The key is that the high initial rate helps escape bad local minima early, while the decreasing rate allows fine-tuning later. model.parameters() returns an iterator over all trainable tensors in the model.',
          options: ['Create SGD optimizer', 'Import optimizer module', 'Create scheduler', 'Run training loop'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Create StepLR scheduler',
          explanation: 'StepLR multiplies the learning rate by gamma (0.5) every step_size (10) epochs.',
          deepDive: 'Every 10 epochs, the learning rate is cut in half. So it starts at 0.1, drops to 0.05 at epoch 10, then 0.025 at epoch 20, and 0.0125 at epoch 30.',
          deeperDive: 'StepLR applies: lr_new = lr_initial * gamma^(epoch // step_size). With step_size=10 and gamma=0.5: epochs 0-9 use lr=0.1, epochs 10-19 use lr=0.05, epochs 20-29 use lr=0.025. Alternatives include MultiStepLR (decay at specific milestones like [30, 60, 90]), ExponentialLR (decay every epoch by gamma), and CosineAnnealingLR (smoothly oscillates between a max and min lr following a cosine curve). ReduceLROnPlateau is adaptive -- it monitors a metric and reduces lr only when improvement stalls.',
          options: ['Create StepLR scheduler', 'Create SGD optimizer', 'Import optimizer module', 'Run training loop'],
        },
        {
          startLine: 6,
          endLine: 9,
          color: 'XRAY_TRAIN',
          correctLabel: 'Training loop with scheduler',
          explanation: 'After each epoch, scheduler.step() updates the learning rate. get_last_lr() shows the current value.',
          deepDive: 'The training loop runs normally, but after each epoch, scheduler.step() checks if it is time to reduce the learning rate. Printing it lets you verify the schedule is working.',
          deeperDive: 'scheduler.step() must be called once per epoch (not once per batch, unless you use a batch-level scheduler like OneCycleLR). Calling it too often will decay the learning rate too fast. The order matters: train first, then step the scheduler. In older PyTorch versions, scheduler.step() was called before the optimizer, but the current convention is to call it after. get_last_lr() returns a list of learning rates (one per parameter group). If you only have one parameter group, it returns something like [0.05].',
          options: ['Training loop with scheduler', 'Create StepLR scheduler', 'Create SGD optimizer', 'Import optimizer module'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'import torch.optim as optim',
          lines: [0],
        },
        {
          id: 'optimizer',
          code: 'optimizer = optim.SGD(model.parameters(), lr=0.1)',
          lines: [2],
        },
        {
          id: 'scheduler',
          code: 'scheduler = optim.lr_scheduler.StepLR(\n    optimizer, step_size=10, gamma=0.5)',
          lines: [3, 4],
        },
        {
          id: 'loop',
          code: 'for epoch in range(30):\n    train_one_epoch(model, optimizer)\n    scheduler.step()\n    print(f"LR: {scheduler.get_last_lr()}")',
          lines: [6, 7, 8, 9],
        },
      ],
    },

    rewire: {
      goal: 'Decay every 5 epochs by 0.1x',
      targets: [
        {
          line: 4,
          description: 'Change step_size and gamma',
          currentCode: '    optimizer, step_size=10, gamma=0.5)',
          options: [
            { label: 'step_size=5, gamma=0.1', newCode: '    optimizer, step_size=5, gamma=0.1)', correct: true },
            { label: 'step_size=10, gamma=0.1', newCode: '    optimizer, step_size=10, gamma=0.1)', correct: false },
            { label: 'step_size=5, gamma=0.5', newCode: '    optimizer, step_size=5, gamma=0.5)', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 3: Production
  // ================================================================

  // LESSON 7: Save & Load
  {
    id: 'save_and_load',
    name: 'Save & Load',
    chapter: 2,
    description: 'Persist model weights to disk and reload them.',
    tracer: [
      { text: 'Training takes time. You want to save the result.', viz: 'save_why' },
      { text: 'state_dict() captures all weights.', viz: 'save_dict' },
      { text: 'torch.save writes them to a file.', viz: 'save_file' },
      { text: 'load_state_dict restores the model.', viz: 'save_load' },
    ],
    code: [
      'import torch',
      '',
      '# Save',
      'torch.save(model.state_dict(), "model.pth")',
      '',
      '# Load',
      'loaded_model = MyModel()',
      'state = torch.load("model.pth")',
      'loaded_model.load_state_dict(state)',
      'loaded_model.eval()',
    ],

    xray: {
      pipeline: ['import', 'save\nweights', 'create\nnew model', 'load\nweights', 'eval\nmode'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import torch',
          explanation: 'torch.save and torch.load are the core serialization functions.',
          deepDive: 'torch provides save/load functions that can serialize any Python object using pickle, but for models the recommended approach is to save just the state_dict (weights) rather than the entire model object.',
          deeperDive: 'You could do torch.save(model, "model.pth") to save the entire model, but this is fragile -- it pickles the class definition by reference, so if you rename the class, move the file, or change the import path, loading fails. Saving state_dict() is more robust because it only contains the weight tensors and their names, not any Python code. This is the officially recommended approach in the PyTorch documentation.',
          options: ['Import torch', 'Save model weights', 'Create new model', 'Load weights into model'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Save model weights',
          explanation: 'state_dict() returns all weights as a dictionary. torch.save writes it to a file.',
          deepDive: 'state_dict() is like taking a snapshot of every weight in the model. torch.save writes that snapshot to a file. The ".pth" extension is a PyTorch convention.',
          deeperDive: 'model.state_dict() returns an OrderedDict mapping parameter names to tensors, like {"fc1.weight": tensor(...), "fc1.bias": tensor(...), "fc2.weight": tensor(...), "fc2.bias": tensor(...)}. torch.save uses Python pickle internally, with some optimizations for tensors. The file extension ".pth" or ".pt" is conventional but not required -- you could use any extension. For large models, the file can be gigabytes. You can also save optimizer state with torch.save(optimizer.state_dict(), "optim.pth") to resume training from a checkpoint.',
          options: ['Save model weights', 'Import torch', 'Load weights into model', 'Set eval mode'],
        },
        {
          startLine: 5,
          endLine: 7,
          color: 'XRAY_MODEL',
          correctLabel: 'Create model and load file',
          explanation: 'First create a new model with random weights, then load the saved weights from disk.',
          deepDive: 'You must create the model architecture first (same class, same layer sizes) and then overwrite its random weights with the saved ones. The model shape must match exactly.',
          deeperDive: 'MyModel() initializes a fresh model with random weights. torch.load("model.pth") reads the file and reconstructs the OrderedDict of tensors. If the file was saved on GPU and you are loading on CPU, use torch.load("model.pth", map_location="cpu"). The loaded state dict contains tensor names like "fc1.weight" -- these must exactly match the parameter names in the new model. If they do not match (e.g., you renamed a layer), load_state_dict raises a RuntimeError listing the missing/unexpected keys.',
          options: ['Create model and load file', 'Save model weights', 'Apply weights to model', 'Import torch'],
        },
        {
          startLine: 8,
          endLine: 9,
          color: 'XRAY_PREDICT',
          correctLabel: 'Apply weights and set eval',
          explanation: 'load_state_dict copies saved weights into the model. eval() disables dropout/BatchNorm training behavior.',
          deepDive: 'load_state_dict overwrites the random weights with the trained ones. Calling eval() ensures the model behaves correctly for inference -- no dropout, stable BatchNorm.',
          deeperDive: 'load_state_dict(state) copies each tensor from the dictionary into the corresponding parameter of the model. By default, strict=True means all keys must match exactly. You can pass strict=False to ignore missing or extra keys, which is useful for transfer learning when you only want to load some layers. After loading, always call model.eval() before inference. If you plan to continue training (fine-tuning), call model.train() instead and also load the optimizer state from a saved checkpoint.',
          options: ['Apply weights and set eval', 'Create model and load file', 'Save model weights', 'Import torch'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'import torch',
          lines: [0],
        },
        {
          id: 'save',
          code: '# Save\ntorch.save(model.state_dict(), "model.pth")',
          lines: [2, 3],
        },
        {
          id: 'create_load',
          code: '# Load\nloaded_model = MyModel()\nstate = torch.load("model.pth")',
          lines: [5, 6, 7],
        },
        {
          id: 'apply',
          code: 'loaded_model.load_state_dict(state)\nloaded_model.eval()',
          lines: [8, 9],
        },
      ],
    },

    rewire: {
      goal: 'Save to a different filename',
      targets: [
        {
          line: 3,
          description: 'Change the save path',
          currentCode: 'torch.save(model.state_dict(), "model.pth")',
          options: [
            { label: '"checkpoint.pth"', newCode: 'torch.save(model.state_dict(), "checkpoint.pth")', correct: true },
            { label: '"model.pth"', newCode: 'torch.save(model.state_dict(), "model.pth")', correct: false },
            { label: '"weights.json"', newCode: 'torch.save(model.state_dict(), "weights.json")', correct: false },
          ],
        },
        {
          line: 7,
          description: 'Update the load path to match',
          currentCode: 'state = torch.load("model.pth")',
          options: [
            { label: '"checkpoint.pth"', newCode: 'state = torch.load("checkpoint.pth")', correct: true },
            { label: '"model.pth"', newCode: 'state = torch.load("model.pth")', correct: false },
            { label: '"checkpoint.pt"', newCode: 'state = torch.load("checkpoint.pt")', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 8: Transfer Learning
  {
    id: 'transfer_learning',
    name: 'Transfer Learning',
    chapter: 2,
    description: 'Reuse a pretrained model for a new task.',
    tracer: [
      { text: 'Pretrained models already know image features.', viz: 'tl_pretrained' },
      { text: 'Freeze the body to keep learned features.', viz: 'tl_freeze' },
      { text: 'Replace the head for your new task.', viz: 'tl_head' },
      { text: 'Train only the new head layer.', viz: 'tl_train' },
    ],
    code: [
      'import torchvision.models as models',
      'import torch.nn as nn',
      '',
      'model = models.resnet18(pretrained=True)',
      '',
      'for param in model.parameters():',
      '    param.requires_grad = False',
      '',
      'model.fc = nn.Linear(512, 5)',
      '',
      'optimizer = torch.optim.Adam(',
      '    model.fc.parameters(), lr=0.001)',
    ],

    xray: {
      pipeline: ['imports', 'pretrained\nmodel', 'freeze\nparams', 'new\nhead', 'optimizer'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import pretrained models',
          explanation: 'torchvision.models has pretrained architectures like ResNet, VGG, and EfficientNet.',
          deepDive: 'torchvision.models is a gallery of famous neural network architectures with pretrained weights. You can download a model that was trained on millions of images and adapt it to your task.',
          deeperDive: 'torchvision.models provides dozens of architectures: ResNet (18/34/50/101/152 layers), VGG (11/13/16/19), EfficientNet, MobileNet, Vision Transformer (ViT), and more. Each can be loaded with weights pretrained on ImageNet (1.2 million images, 1000 classes). The pretrained weights encode general visual features like edges, textures, and object parts that transfer well to new image tasks. Using pretrained models typically gives much better results than training from scratch, especially when you have limited data (fewer than 10,000 images).',
          options: ['Import pretrained models', 'Load ResNet18', 'Freeze parameters', 'Replace the head'],
        },
        {
          startLine: 3,
          endLine: 3,
          color: 'XRAY_MODEL',
          correctLabel: 'Load pretrained ResNet18',
          explanation: 'ResNet18 is loaded with weights trained on ImageNet (1000 classes, 1.2M images).',
          deepDive: 'This single line downloads a neural network that was trained for days on powerful GPUs. It already knows how to recognize edges, textures, shapes, and objects in images.',
          deeperDive: 'ResNet18 has 11.7 million parameters organized in residual blocks with skip connections that allow gradients to flow through very deep networks. The "18" refers to the number of weighted layers. pretrained=True (or weights=ResNet18_Weights.IMAGENET1K_V1 in newer PyTorch) downloads ~45MB of weights. The model expects input images of shape [batch, 3, 224, 224] (3 color channels, 224x224 pixels, normalized with ImageNet mean and std). The final layer model.fc is nn.Linear(512, 1000) for 1000 ImageNet classes.',
          options: ['Load pretrained ResNet18', 'Import pretrained models', 'Freeze parameters', 'Replace the head'],
        },
        {
          startLine: 5,
          endLine: 6,
          color: 'XRAY_DATA',
          correctLabel: 'Freeze all parameters',
          explanation: 'Setting requires_grad = False prevents the optimizer from updating pretrained weights.',
          deepDive: 'Freezing locks the pretrained knowledge in place. The model already knows good image features, so you do not want random training steps to mess them up.',
          deeperDive: 'requires_grad = False tells PyTorch\'s autograd engine to skip computing gradients for this parameter. This has two benefits: (1) the pretrained features are preserved exactly as learned on ImageNet, and (2) training is much faster because backward() only computes gradients for the unfrozen layers. For ResNet18, this means 11.7M parameters are frozen and only the new head\'s parameters are trained. In practice, you might later "unfreeze" some layers for fine-tuning with a very low learning rate to squeeze out a bit more accuracy.',
          options: ['Freeze all parameters', 'Load pretrained ResNet18', 'Replace the head', 'Set up optimizer'],
        },
        {
          startLine: 8,
          endLine: 8,
          color: 'XRAY_PREDICT',
          correctLabel: 'Replace head for new task',
          explanation: 'Swap the 1000-class head for a 5-class head. nn.Linear(512, 5) is randomly initialized.',
          deepDive: 'ResNet18 was built for 1000 ImageNet classes, but you might only need 5 classes (like cat breeds). Replacing the head layer adapts the model to your specific task.',
          deeperDive: 'model.fc is ResNet18\'s final classification layer, originally nn.Linear(512, 1000). By assigning model.fc = nn.Linear(512, 5), you replace it with a new randomly initialized layer for 5 classes. The 512 comes from ResNet18\'s last feature layer output size. Since this new layer was not part of the frozen loop above, its parameters have requires_grad = True by default, meaning the optimizer will update them. The rest of the network (convolutional layers, batch norms) acts as a fixed feature extractor.',
          options: ['Replace head for new task', 'Freeze all parameters', 'Load pretrained ResNet18', 'Create optimizer'],
        },
        {
          startLine: 10,
          endLine: 11,
          color: 'XRAY_TRAIN',
          correctLabel: 'Optimize only new head',
          explanation: 'Pass only model.fc.parameters() to Adam so only the new head is trained.',
          deepDive: 'By passing model.fc.parameters() instead of model.parameters(), you tell the optimizer to only update the 5-class head. The frozen body stays untouched.',
          deeperDive: 'model.fc.parameters() returns only the weight [5, 512] and bias [5] tensors of the replacement head -- a total of 2,565 trainable parameters out of 11.7 million in the full model. This makes training extremely fast: you only need a few hundred images and a few minutes on a CPU. Adam with lr=0.001 is a good default for transfer learning. If you later want to fine-tune the entire model, you would unfreeze parameters and create a new optimizer with model.parameters() and a much smaller learning rate (like 1e-5) to avoid destroying the pretrained features.',
          options: ['Optimize only new head', 'Replace head for new task', 'Freeze all parameters', 'Load pretrained ResNet18'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'imports',
          code: 'import torchvision.models as models\nimport torch.nn as nn',
          lines: [0, 1],
        },
        {
          id: 'load',
          code: 'model = models.resnet18(pretrained=True)',
          lines: [3],
        },
        {
          id: 'freeze',
          code: 'for param in model.parameters():\n    param.requires_grad = False',
          lines: [5, 6],
        },
        {
          id: 'head',
          code: 'model.fc = nn.Linear(512, 5)',
          lines: [8],
        },
        {
          id: 'optimizer',
          code: 'optimizer = torch.optim.Adam(\n    model.fc.parameters(), lr=0.001)',
          lines: [10, 11],
        },
      ],
    },

    rewire: {
      goal: 'Classify 20 classes instead of 5',
      targets: [
        {
          line: 8,
          description: 'Change the number of output classes',
          currentCode: 'model.fc = nn.Linear(512, 5)',
          options: [
            { label: 'nn.Linear(512, 20)', newCode: 'model.fc = nn.Linear(512, 20)', correct: true },
            { label: 'nn.Linear(512, 10)', newCode: 'model.fc = nn.Linear(512, 10)', correct: false },
            { label: 'nn.Linear(20, 5)', newCode: 'model.fc = nn.Linear(20, 5)', correct: false },
          ],
        },
      ],
    },
  },
];
