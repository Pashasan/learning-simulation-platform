// ============================================================
// LEVELS — 8 Lessons across 3 Chapters with X-Ray / Assemble / Rewire rounds
// ============================================================

export const LEVELS = [
  // ================================================================
  // CHAPTER 1: Tensors & Models
  // ================================================================

  // LESSON 1: The Data
  {
    id: 'the_data',
    name: 'The Data',
    chapter: 0,
    description: 'Images are just numbers. Reshape them for the network.',
    tracer: [
      { text: 'A 28\u00D728 image is a grid of pixels.', viz: 'data_grid' },
      { text: 'Each pixel is a number from 0 to 1.', viz: 'data_numbers' },
      { text: 'Reshape flattens the grid into a list.', viz: 'data_flatten' },
      { text: 'Now it\u2019s ready for a neural network.', viz: 'data_ready' },
    ],
    code: [
      'import torch',
      '',
      'image = torch.rand(28, 28)',
      'print(image.shape)',
      '',
      'flat = image.reshape(784)',
      'print(flat.shape)',
    ],

    xray: {
      pipeline: ['torch', '28\u00D728', 'flat 784'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import the library',
          explanation: 'torch is PyTorch \u2014 the toolkit for tensors and neural networks.',
          deepDive: 'PyTorch is a toolkit for building and training neural networks. Importing it is like opening a toolbox before you start a project.',
          deeperDive: 'The torch package gives you three major capabilities: tensors (multi-dimensional arrays that can run on GPU), autograd (automatic differentiation for computing gradients), and torch.nn (pre-built neural network layers). When you run import torch, Python loads the entire library into memory so you can call functions like torch.rand(), torch.zeros(), or torch.tensor(). PyTorch can run on CPU by default, but if you have an NVIDIA GPU you can move tensors there with tensor.to("cuda") for 10-50x speedups on large matrix operations.',
          options: ['Import the library', 'Create a tensor', 'Define a model', 'Print output'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Create a 28x28 image',
          explanation: 'torch.rand makes random numbers. 28\u00D728 = 784 pixels, like a handwritten digit.',
          deepDive: 'This makes a 28-by-28 grid of random numbers between 0 and 1, like a tiny grayscale photo. Real handwritten digit images are exactly this size.',
          deeperDive: 'torch.rand(28, 28) generates a 28x28 tensor of floats sampled uniformly from [0, 1). Compare this to torch.zeros(28, 28) which gives all 0s (a black image) or torch.ones(28, 28) which gives all 1s (a white image). The .shape property returns torch.Size([28, 28]), confirming the dimensions. The size 28x28 is not arbitrary -- it is the standard resolution of the MNIST handwritten digit dataset, which has been the benchmark for image classification since 1998. Each pixel value represents brightness: 0.0 is black, 1.0 is white, and values in between are shades of gray.',
          options: ['Create a 28x28 image', 'Flatten the image', 'Import the library', 'Make a prediction'],
        },
        {
          startLine: 5,
          endLine: 6,
          color: 'XRAY_PREDICT',
          correctLabel: 'Flatten into one list',
          explanation: 'reshape(784) turns the 2D grid into a 1D list \u2014 neural networks need flat input.',
          deepDive: 'Think of reading a book page left-to-right, top-to-bottom. Reshape does the same thing to the pixel grid, lining all 784 numbers into one row so the network can read them.',
          deeperDive: 'reshape(784) and view(784) both convert the 2D tensor into 1D, but view requires the tensor to be stored contiguously in memory while reshape always works. The number 784 must equal 28 * 28 -- if you pass the wrong number, PyTorch raises a RuntimeError. Linear layers (nn.Linear) expect 1D input because they multiply the input by a weight matrix using standard matrix multiplication. You could also write image.reshape(-1), where -1 tells PyTorch to figure out the correct size automatically. The total element count must always be preserved: a 28x28 tensor has 784 elements, so you can reshape to (784,) or (1, 784) or (4, 196), but never to (500,).',
          options: ['Flatten into one list', 'Create a 28x28 image', 'Define a layer', 'Train the model'],
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
          id: 'create',
          code: 'image = torch.rand(28, 28)\nprint(image.shape)',
          lines: [2, 3],
        },
        {
          id: 'flatten',
          code: 'flat = image.reshape(784)\nprint(flat.shape)',
          lines: [5, 6],
        },
      ],
    },

    rewire: {
      goal: 'Change to a 32x32 image',
      targets: [
        {
          line: 2,
          description: 'Change the image size',
          currentCode: 'image = torch.rand(28, 28)',
          options: [
            { label: 'torch.rand(32, 32)', newCode: 'image = torch.rand(32, 32)', correct: true },
            { label: 'torch.rand(28, 32)', newCode: 'image = torch.rand(28, 32)', correct: false },
            { label: 'torch.rand(64, 64)', newCode: 'image = torch.rand(64, 64)', correct: false },
          ],
        },
        {
          line: 5,
          description: 'Update reshape to match',
          currentCode: 'flat = image.reshape(784)',
          options: [
            { label: 'image.reshape(1024)', newCode: 'flat = image.reshape(1024)', correct: true },
            { label: 'image.reshape(784)', newCode: 'flat = image.reshape(784)', correct: false },
            { label: 'image.reshape(32)', newCode: 'flat = image.reshape(32)', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 2: The Model
  {
    id: 'the_model',
    name: 'The Model',
    chapter: 0,
    description: 'Stack layers to build a neural network.',
    tracer: [
      { text: 'A model is a stack of layers.', viz: 'model_stack' },
      { text: 'Each layer transforms the data.', viz: 'model_transform' },
      { text: 'ReLU removes negative values.', viz: 'model_relu' },
      { text: 'The output has one score per class.', viz: 'model_output' },
    ],
    code: [
      'import torch.nn as nn',
      '',
      'model = nn.Sequential(',
      '    nn.Linear(784, 128),',
      '    nn.ReLU(),',
      '    nn.Linear(128, 10)',
      ')',
    ],

    xray: {
      pipeline: ['nn', 'Sequential', 'Linear\n784\u2192128', 'ReLU', 'Linear\n128\u219210'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import neural network tools',
          explanation: 'nn has all the building blocks \u2014 layers, activations, loss functions.',
          deepDive: 'The nn module is a box of ready-made building blocks for neural networks -- layers, activations, and more. The "as nn" part is just a shortcut so you type less.',
          deeperDive: 'torch.nn contains the nn.Module base class that every neural network inherits from. It also provides layers like nn.Linear, nn.Conv2d, and nn.LSTM, activations like nn.ReLU and nn.Sigmoid, loss functions like nn.CrossEntropyLoss, and container modules like nn.Sequential. The "as nn" alias means you write nn.Linear instead of torch.nn.Linear -- purely a convenience. Without this module you would have to manually create weight matrices, write your own forward pass math, and handle gradient registration yourself.',
          options: ['Import neural network tools', 'Define a model', 'Create training data', 'Set learning rate'],
        },
        {
          startLine: 2,
          endLine: 6,
          color: 'XRAY_MODEL',
          correctLabel: 'Build the model',
          explanation: 'Sequential stacks layers in order. Data flows top to bottom.',
          deepDive: 'Sequential is like an assembly line: you list the steps in order, and the data moves through each one automatically from start to finish.',
          deeperDive: 'nn.Sequential is a convenience container -- you pass in layers in order and it chains their outputs together automatically. The alternative is writing a custom class that inherits from nn.Module and defining a forward() method yourself, which gives more flexibility (like skip connections or branching). When you call model(input), Python actually calls model.__call__(input), which internally calls model.forward(input) plus some bookkeeping for hooks and gradient tracking. Sequential handles all of that plumbing for you, making it ideal for simple stack-of-layers architectures.',
          options: ['Build the model', 'Import the library', 'Train the network', 'Load the data'],
        },
        {
          startLine: 3,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Hidden layer (784 in, 128 out)',
          explanation: 'Linear connects every input to every output. 784 pixels in, 128 features out.',
          deepDive: 'A Linear layer connects every input to every output with adjustable weights. Think of 128 detectors, each scanning all 784 pixels to spot a different pattern.',
          deeperDive: 'nn.Linear(784, 128) computes y = Wx + b, where W is a 128x784 weight matrix and b is a bias vector of length 128. That means this single layer has 784 * 128 + 128 = 100,480 trainable parameters. Each of the 128 output neurons receives a weighted sum of all 784 inputs, so every pixel contributes to every feature. The layer is called "hidden" because its outputs are not directly visible as input or final output -- they are internal representations the network learns on its own.',
          options: ['Hidden layer (784 in, 128 out)', 'Output layer (10 classes)', 'Activation function', 'Loss function'],
        },
        {
          startLine: 4,
          endLine: 4,
          color: 'XRAY_PREDICT',
          correctLabel: 'Activation function',
          explanation: 'ReLU zeroes out negatives. This lets the network learn non-linear patterns.',
          deepDive: 'ReLU is a simple rule: keep positive numbers, replace negatives with zero. Like [3, -1, 0] becomes [3, 0, 0]. Without it, stacked layers would just act as one big layer.',
          deeperDive: 'Non-linearity is essential because stacking two linear transformations (y = W2(W1x + b1) + b2) simplifies to a single linear transformation (y = W3x + b3). ReLU breaks this linearity, allowing the network to learn curves and complex decision boundaries. Other activations include Sigmoid (squashes to 0-1), Tanh (squashes to -1 to 1), and LeakyReLU (allows a small slope for negatives instead of zero). ReLU is the most popular because it is computationally cheap -- just a max(0, x) -- and it avoids the vanishing gradient problem that slows training with Sigmoid and Tanh.',
          options: ['Activation function', 'Hidden layer', 'Output layer', 'Optimizer step'],
        },
        {
          startLine: 5,
          endLine: 5,
          color: 'XRAY_TRAIN',
          correctLabel: 'Output layer (10 classes)',
          explanation: '128 features in, 10 scores out \u2014 one per digit (0\u20139).',
          deepDive: 'There are 10 output slots, one for each digit 0 through 9. The slot with the highest score is the model\'s guess -- like a scoreboard where the top scorer wins.',
          deeperDive: 'The 10 raw output values are called logits -- unnormalized scores that can be any real number, positive or negative. To convert logits into probabilities, you apply softmax: prob_i = exp(logit_i) / sum(exp(all_logits)), which guarantees all values are between 0 and 1 and sum to 1.0. For example, logits [2.1, -0.5, 0.3, ...] might become probabilities [0.72, 0.05, 0.12, ...]. The 10 corresponds to digit classes 0 through 9. If you were classifying 26 letters instead, you would use nn.Linear(128, 26).',
          options: ['Output layer (10 classes)', 'Hidden layer', 'Activation function', 'Input layer'],
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
          id: 'sequential',
          code: 'model = nn.Sequential(',
          lines: [2],
        },
        {
          id: 'hidden',
          code: '    nn.Linear(784, 128),\n    nn.ReLU(),',
          lines: [3, 4],
        },
        {
          id: 'output',
          code: '    nn.Linear(128, 10)\n)',
          lines: [5, 6],
        },
      ],
    },

    rewire: {
      goal: 'Classify 26 letters instead of 10 digits',
      targets: [
        {
          line: 5,
          description: 'Change the output size',
          currentCode: '    nn.Linear(128, 10)',
          options: [
            { label: 'nn.Linear(128, 26)', newCode: '    nn.Linear(128, 26)', correct: true },
            { label: 'nn.Linear(26, 10)', newCode: '    nn.Linear(26, 10)', correct: false },
            { label: 'nn.Linear(784, 26)', newCode: '    nn.Linear(784, 26)', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 3: Forward Pass (renamed from The Prediction)
  {
    id: 'forward_pass',
    name: 'Forward Pass',
    chapter: 0,
    description: 'Feed data through the model and read the output.',
    tracer: [
      { text: 'Data flows in one end.', viz: 'predict_input' },
      { text: 'Each layer transforms it.', viz: 'predict_layers' },
      { text: 'argmax picks the highest score.', viz: 'predict_argmax' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      '',
      'image = torch.rand(784)',
      'model = nn.Sequential(',
      '    nn.Linear(784, 128),',
      '    nn.ReLU(),',
      '    nn.Linear(128, 10)',
      ')',
      '',
      'scores = model(image)',
      'prediction = scores.argmax()',
      'print(prediction)',
    ],

    xray: {
      pipeline: ['imports', 'data', 'model', 'predict', 'print'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'We need both torch (tensors) and nn (layers) to run a model.',
          deepDive: 'One import gives you number-crunching tools, the other gives you neural network building blocks. Most PyTorch scripts start with both.',
          deeperDive: 'You need "import torch" when creating tensors (torch.rand, torch.zeros, torch.tensor) or using tensor operations (argmax, reshape). You need "import torch.nn as nn" when building model architectures (nn.Sequential, nn.Linear, nn.ReLU). Some scripts only need one -- for example, a data preprocessing script might only use torch for tensor math, while a model definition file might only use nn. In practice, most training scripts import both because you need tensors for data and nn for the model.',
          options: ['Import libraries', 'Prepare data', 'Define model', 'Make prediction'],
        },
        {
          startLine: 3,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Prepare input data',
          explanation: 'A flat tensor of 784 random values \u2014 standing in for a real image.',
          deepDive: 'This is a fake image made of 784 random numbers, already flattened. It is like a placeholder -- good for testing that the model runs, even before you load real pictures.',
          deeperDive: 'In real projects, data comes from a DataLoader that yields batches of tensors. Here we use torch.rand(784) which generates 784 floats drawn uniformly from the interval [0, 1) -- a quick stand-in for a real image. The shape torch.Size([784]) matters because our model expects exactly 784 inputs (matching nn.Linear(784, 128)). If you passed a tensor of shape (100,) instead, PyTorch would raise a RuntimeError about mismatched matrix sizes. You can inspect any tensor with print(image.shape) and print(image.dtype), which would show torch.float32 by default.',
          options: ['Prepare input data', 'Define model', 'Make prediction', 'Import libraries'],
        },
        {
          startLine: 4,
          endLine: 8,
          color: 'XRAY_MODEL',
          correctLabel: 'Define the model',
          explanation: 'Same two-layer network: 784\u2192128\u219210. It doesn\u2019t know anything yet.',
          deepDive: 'Same two-layer network as before. Right now the weights are random, so the model is just guessing. Training later is what teaches it to be accurate.',
          deeperDive: 'When you create nn.Linear layers, PyTorch initializes the weights using Kaiming uniform initialization (also called He initialization), which samples values scaled to the layer size so signals do not explode or vanish as they flow through. You can see all parameters with list(model.parameters()), which returns 4 tensors: W1 (128x784), b1 (128,), W2 (10x128), b2 (10,). The model itself is a callable Python object -- calling model(image) is syntactic sugar for model.forward(image), which passes the input through each layer in sequence.',
          options: ['Define the model', 'Prepare input data', 'Train the model', 'Show the result'],
        },
        {
          startLine: 10,
          endLine: 11,
          color: 'XRAY_PREDICT',
          correctLabel: 'Make a prediction',
          explanation: 'model(image) runs the forward pass. argmax picks the class with the highest score.',
          deepDive: 'Feeding data through the model gives 10 scores. argmax picks the position of the highest one -- like finding the tallest bar on a chart. That position is the predicted digit.',
          deeperDive: 'model(image) triggers the forward pass, running the input through Linear -> ReLU -> Linear to produce a tensor of 10 logit scores, like tensor([0.12, -0.45, 0.88, ...]). The scores are raw and unnormalized -- they are not probabilities yet. scores.argmax() returns the index of the largest value, not the value itself. So if index 7 has the highest score, argmax returns tensor(7), meaning the model predicts digit 7. Note that argmax with no dim argument works on the flattened tensor, which is fine here since scores is already 1D with shape (10,).',
          options: ['Make a prediction', 'Train the model', 'Define the model', 'Import libraries'],
        },
        {
          startLine: 12,
          endLine: 12,
          color: 'XRAY_TRAIN',
          correctLabel: 'Show the result',
          explanation: 'print outputs the predicted digit \u2014 a number from 0 to 9.',
          deepDive: 'Right now the answer is random because the model has not been trained yet. After training, this same print line would show a meaningful prediction.',
          deeperDive: 'The prediction tensor contains the class index as a 0-dimensional tensor, like tensor(3). Printing it shows "tensor(3)". If you want just the plain Python integer 3, you call prediction.item(), which extracts the scalar value from a single-element tensor. This is important when logging results or comparing to Python integers. The .item() method only works on tensors with exactly one element -- calling it on a multi-element tensor raises a ValueError.',
          options: ['Show the result', 'Make a prediction', 'Prepare input data', 'Define the model'],
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
          id: 'data',
          code: 'image = torch.rand(784)',
          lines: [3],
        },
        {
          id: 'model',
          code: 'model = nn.Sequential(\n    nn.Linear(784, 128),\n    nn.ReLU(),\n    nn.Linear(128, 10)\n)',
          lines: [4, 5, 6, 7, 8],
        },
        {
          id: 'predict',
          code: 'scores = model(image)\nprediction = scores.argmax()',
          lines: [10, 11],
        },
        {
          id: 'result',
          code: 'print(prediction)',
          lines: [12],
        },
      ],
    },

    rewire: {
      goal: 'Use a bigger hidden layer (256 neurons)',
      targets: [
        {
          line: 5,
          description: 'Change hidden layer size',
          currentCode: '    nn.Linear(784, 128),',
          options: [
            { label: 'nn.Linear(784, 256)', newCode: '    nn.Linear(784, 256),', correct: true },
            { label: 'nn.Linear(784, 64)', newCode: '    nn.Linear(784, 64),', correct: false },
            { label: 'nn.Linear(256, 128)', newCode: '    nn.Linear(256, 128),', correct: false },
          ],
        },
        {
          line: 7,
          description: 'Update output layer input to match',
          currentCode: '    nn.Linear(128, 10)',
          options: [
            { label: 'nn.Linear(256, 10)', newCode: '    nn.Linear(256, 10)', correct: true },
            { label: 'nn.Linear(128, 10)', newCode: '    nn.Linear(128, 10)', correct: false },
            { label: 'nn.Linear(256, 256)', newCode: '    nn.Linear(256, 256)', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 2: Training
  // ================================================================

  // LESSON 4: Loss & Gradients (renamed from Training)
  {
    id: 'loss_and_gradients',
    name: 'Loss & Gradients',
    chapter: 1,
    description: 'Teach the model to learn from its mistakes.',
    tracer: [
      { text: 'The model makes a guess.', viz: 'train_guess' },
      { text: 'Loss measures how wrong it is.', viz: 'train_loss' },
      { text: 'Gradients point toward improvement.', viz: 'train_gradients' },
      { text: 'Repeat to get better.', viz: 'train_repeat' },
    ],
    code: [
      'loss_fn = nn.CrossEntropyLoss()',
      'optimizer = torch.optim.Adam(model.parameters(), lr=0.01)',
      '',
      'for epoch in range(10):',
      '    scores = model(image)',
      '    loss = loss_fn(scores, label)',
      '',
      '    optimizer.zero_grad()',
      '    loss.backward()',
      '    optimizer.step()',
    ],

    xray: {
      pipeline: ['loss fn', 'optimizer', 'forward', 'zero_grad', 'backward\n+ step'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_PREDICT',
          correctLabel: 'Loss function',
          explanation: 'CrossEntropyLoss measures how wrong the prediction is. Lower = better.',
          deepDive: 'Think of it like a teacher grading a quiz. If the model\'s answer is close to correct, the score is low (good). If it is way off, the score is high (bad). The goal is to drive this number toward zero.',
          deeperDive: 'CrossEntropyLoss internally combines two operations: softmax (converting logits to probabilities) and negative log likelihood loss. If the model assigns probability 0.9 to the correct class, the loss is -log(0.9) = 0.105, which is low. If it assigns probability 0.01, the loss is -log(0.01) = 4.6, which is high. For a random 10-class model that assigns equal probability 0.1 to each class, the expected loss is -log(0.1) = 2.302. So when you first create an untrained model, expect a loss around 2.3 -- anything much higher suggests a bug.',
          options: ['Loss function', 'Optimizer', 'Forward pass', 'Update weights'],
        },
        {
          startLine: 1,
          endLine: 1,
          color: 'XRAY_MODEL',
          correctLabel: 'Optimizer',
          explanation: 'Adam adjusts the weights to reduce loss. lr=0.01 is the learning rate (step size).',
          deepDive: 'The optimizer nudges the model\'s weights to reduce mistakes. The learning rate controls how big each nudge is -- too big and you overshoot, too small and learning is painfully slow.',
          deeperDive: 'Adam (Adaptive Moment Estimation) maintains per-parameter running averages of both the gradient and its square, allowing it to adapt the learning rate for each weight individually. SGD (Stochastic Gradient Descent) uses a single fixed learning rate for all parameters, which is simpler but often needs careful tuning. model.parameters() returns an iterator over all trainable weight tensors in the model. Common learning rates are 0.001 for Adam and 0.01-0.1 for SGD. You can also use learning rate schedulers like torch.optim.lr_scheduler.StepLR to automatically decrease the rate during training.',
          options: ['Optimizer', 'Loss function', 'Forward pass', 'Calculate error'],
        },
        {
          startLine: 4,
          endLine: 5,
          color: 'XRAY_DATA',
          correctLabel: 'Forward pass + calculate error',
          explanation: 'Run the image through the model, then measure how far off the guess is.',
          deepDive: 'First the model makes its guess, then the loss function checks the answer key. If the guess is wrong, the loss is big, which tells the model it needs to adjust more.',
          deeperDive: 'The loss tensor is not just a number -- it carries the entire computation graph with it, recording every operation that produced it. This graph is what makes backpropagation possible. When you call loss.backward() later, PyTorch walks backward through this graph using the chain rule to compute the partial derivative of the loss with respect to every single weight in the model. Without this graph (for example, if you called loss.item() and tried to backprop from that), there would be no way to compute gradients.',
          options: ['Forward pass + calculate error', 'Update weights', 'Optimizer', 'Loss function'],
        },
        {
          startLine: 7,
          endLine: 7,
          color: 'XRAY_IMPORT',
          correctLabel: 'Clear old gradients',
          explanation: 'zero_grad resets gradients so they don\u2019t pile up from the last step.',
          deepDive: 'Like erasing a chalkboard before solving a new problem. Without this reset, leftover notes from the last step would mix into the current one and mess things up.',
          deeperDive: 'PyTorch accumulates gradients by default -- calling backward() adds to existing .grad values rather than replacing them. This design is intentional: it is useful for certain architectures like RNNs where you want to accumulate gradients over multiple steps. But for standard training, forgetting to call optimizer.zero_grad() is one of the most common bugs. The gradients from the previous batch contaminate the current update, causing erratic weight changes. Always call zero_grad() before backward() in each training iteration.',
          options: ['Clear old gradients', 'Update weights', 'Calculate error', 'Forward pass'],
        },
        {
          startLine: 8,
          endLine: 9,
          color: 'XRAY_TRAIN',
          correctLabel: 'Update weights',
          explanation: 'backward computes gradients. step nudges weights in the right direction.',
          deepDive: 'backward figures out which direction to adjust each weight, like a compass pointing toward "less wrong." Then step actually moves the weights in that direction.',
          deeperDive: 'loss.backward() applies the chain rule of calculus to compute d(loss)/d(weight) for every trainable parameter. These partial derivatives (gradients) are stored in each parameter\'s .grad attribute. Then optimizer.step() applies the update rule: for basic SGD, each weight becomes w = w - lr * w.grad. For Adam, the update also factors in momentum and adaptive scaling. After step(), the gradients are still stored in .grad -- which is why the next iteration needs zero_grad() to clear them before computing fresh gradients.',
          options: ['Update weights', 'Clear old gradients', 'Forward pass', 'Loss function'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'loss',
          code: 'loss_fn = nn.CrossEntropyLoss()',
          lines: [0],
        },
        {
          id: 'optimizer',
          code: 'optimizer = torch.optim.Adam(model.parameters(), lr=0.01)',
          lines: [1],
        },
        {
          id: 'forward',
          code: 'for epoch in range(10):\n    scores = model(image)\n    loss = loss_fn(scores, label)',
          lines: [3, 4, 5],
        },
        {
          id: 'zero_grad',
          code: '    optimizer.zero_grad()',
          lines: [7],
        },
        {
          id: 'backward',
          code: '    loss.backward()\n    optimizer.step()',
          lines: [8, 9],
        },
      ],
    },

    rewire: {
      goal: 'Use SGD instead of Adam and lower learning rate',
      targets: [
        {
          line: 1,
          description: 'Change the optimizer',
          currentCode: 'optimizer = torch.optim.Adam(model.parameters(), lr=0.01)',
          options: [
            { label: 'torch.optim.SGD(..., lr=0.001)', newCode: 'optimizer = torch.optim.SGD(model.parameters(), lr=0.001)', correct: true },
            { label: 'torch.optim.Adam(..., lr=0.001)', newCode: 'optimizer = torch.optim.Adam(model.parameters(), lr=0.001)', correct: false },
            { label: 'torch.optim.SGD(..., lr=0.1)', newCode: 'optimizer = torch.optim.SGD(model.parameters(), lr=0.1)', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 5: Training Loop (NEW)
  {
    id: 'training_loop',
    name: 'Training Loop',
    chapter: 1,
    description: 'Run the full training loop over multiple epochs.',
    tracer: [
      { text: 'An epoch is one pass through all data.', viz: 'loop_epoch' },
      { text: 'Each batch is a small chunk.', viz: 'loop_batch' },
      { text: 'Forward, loss, backward, step \u2014 repeat.', viz: 'loop_cycle' },
      { text: 'Loss should drop over time.', viz: 'loop_loss_curve' },
    ],
    code: [
      'for epoch in range(5):',
      '    total_loss = 0',
      '    for images, labels in train_loader:',
      '        scores = model(images)',
      '        loss = loss_fn(scores, labels)',
      '',
      '        optimizer.zero_grad()',
      '        loss.backward()',
      '        optimizer.step()',
      '        total_loss += loss.item()',
      '    print(f"Epoch {epoch}: {total_loss:.2f}")',
    ],

    xray: {
      pipeline: ['epoch\nloop', 'batch\nloop', 'forward\n+ loss', 'backward\n+ step'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Epoch loop + loss tracker',
          explanation: 'range(5) means 5 full passes. total_loss tracks how well training is going.',
          deepDive: 'An epoch is like re-reading a textbook cover to cover. Five epochs means the model sees every image five times. The loss counter resets each round so you can track improvement.',
          deeperDive: 'More epochs generally means more learning, but too many can lead to overfitting -- the model memorizes the training data instead of learning general patterns, and performs poorly on new images. A typical sign is training loss keeps dropping while test accuracy plateaus or worsens. total_loss is reset to 0 at the start of each epoch so you get a clean measurement of that epoch\'s performance. Common epoch counts for MNIST are 5-20; more complex datasets like ImageNet might use 90-300 epochs.',
          options: ['Epoch loop + loss tracker', 'Batch loop', 'Forward + loss', 'Backward + step'],
        },
        {
          startLine: 2,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Batch forward + loss',
          explanation: 'Each batch gets a forward pass and a loss calculation.',
          deepDive: 'Instead of feeding all 60,000 images at once, the loader hands them over in small groups (like 64 at a time). Each group gets a prediction and an error check.',
          deeperDive: 'train_loader yields tuples of (images, labels) where images has shape [64, 784] and labels has shape [64]. Processing 64 images at once is called mini-batch stochastic gradient descent. Each batch gives a slightly noisy estimate of the true gradient, but this noise actually helps -- it prevents the model from getting stuck in bad local minima. With 60,000 training images and batch size 64, you get about 938 batches per epoch, meaning the model updates its weights 938 times per pass through the data.',
          options: ['Batch forward + loss', 'Epoch loop', 'Update weights', 'Print results'],
        },
        {
          startLine: 6,
          endLine: 9,
          color: 'XRAY_TRAIN',
          correctLabel: 'Backward + step + accumulate',
          explanation: 'zero_grad, backward, step \u2014 the core update cycle. item() extracts the number.',
          deepDive: 'Same three-step recipe from before -- clear, compute, update -- now running inside a loop for every batch. The running total keeps score of how the model is doing overall.',
          deeperDive: 'loss.item() extracts the Python float from a 0-dimensional tensor, like converting tensor(0.4532) to the plain number 0.4532. This is important because without .item(), writing total_loss += loss would keep the entire computation graph in memory for every batch, eventually causing an out-of-memory crash. By calling .item() you detach the value from the graph and add just a regular number to the running total. The zero_grad/backward/step sequence must happen in exactly this order every iteration.',
          options: ['Backward + step + accumulate', 'Forward + loss', 'Epoch loop', 'Batch loop'],
        },
        {
          startLine: 10,
          endLine: 10,
          color: 'XRAY_PREDICT',
          correctLabel: 'Report epoch loss',
          explanation: 'Print how much total loss accumulated this epoch. It should decrease over time.',
          deepDive: 'This prints something like "Epoch 0: 215.37". If that number shrinks each round, the model is learning. If it stops shrinking, training may be done.',
          deeperDive: 'The f-string f"Epoch {epoch}: {total_loss:.2f}" uses Python\'s format specification: :.2f means display as a float with exactly 2 decimal places. So 215.3712 becomes 215.37. If loss stops decreasing after several epochs, the model may have converged (reached its best performance) or it may need tuning -- a different learning rate, more hidden neurons, or a different optimizer. You can also plot total_loss across epochs to visualize the learning curve, which is a standard diagnostic tool.',
          options: ['Report epoch loss', 'Forward pass', 'Backward pass', 'Batch loop'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'epoch',
          code: 'for epoch in range(5):\n    total_loss = 0',
          lines: [0, 1],
        },
        {
          id: 'batch_forward',
          code: '    for images, labels in train_loader:\n        scores = model(images)\n        loss = loss_fn(scores, labels)',
          lines: [2, 3, 4],
        },
        {
          id: 'backward',
          code: '        optimizer.zero_grad()\n        loss.backward()\n        optimizer.step()\n        total_loss += loss.item()',
          lines: [6, 7, 8, 9],
        },
        {
          id: 'print',
          code: '    print(f"Epoch {epoch}: {total_loss:.2f}")',
          lines: [10],
        },
      ],
    },

    rewire: {
      goal: 'Train for 10 epochs instead of 5',
      targets: [
        {
          line: 0,
          description: 'Change the number of epochs',
          currentCode: 'for epoch in range(5):',
          options: [
            { label: 'range(10)', newCode: 'for epoch in range(10):', correct: true },
            { label: 'range(3)', newCode: 'for epoch in range(3):', correct: false },
            { label: 'range(50)', newCode: 'for epoch in range(50):', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 6: Evaluation (NEW)
  {
    id: 'evaluation',
    name: 'Evaluation',
    chapter: 1,
    description: 'Test the model and measure accuracy.',
    tracer: [
      { text: 'Split data into train and test.', viz: 'eval_split' },
      { text: 'Disable gradient tracking for speed.', viz: 'eval_no_grad' },
      { text: 'Compare predictions to true labels.', viz: 'eval_compare' },
      { text: 'Accuracy = correct / total.', viz: 'eval_accuracy' },
    ],
    code: [
      'correct = 0',
      'total = 0',
      '',
      'with torch.no_grad():',
      '    for images, labels in test_loader:',
      '        scores = model(images)',
      '        preds = scores.argmax(dim=1)',
      '        correct += (preds == labels).sum().item()',
      '        total += labels.size(0)',
      '',
      'accuracy = correct / total',
      'print(f"Accuracy: {accuracy:.2%}")',
    ],

    xray: {
      pipeline: ['counters', 'no_grad', 'predict', 'compare', 'accuracy'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_DATA',
          correctLabel: 'Initialize counters',
          explanation: 'correct and total will track how many the model gets right.',
          deepDive: 'Like a scorecard with two columns: how many the model got right, and how many it tried. Dividing one by the other at the end gives the accuracy.',
          deeperDive: 'We use plain Python integers (correct = 0, total = 0) rather than PyTorch tensors because we only need running totals -- no gradient tracking, no GPU acceleration, no tensor operations. These counters accumulate across all test batches. By the end, correct might be 9,750 and total 10,000. Using Python ints also avoids accidentally keeping computation graphs in memory, which would waste resources during evaluation.',
          options: ['Initialize counters', 'Disable gradients', 'Make predictions', 'Calculate accuracy'],
        },
        {
          startLine: 3,
          endLine: 3,
          color: 'XRAY_IMPORT',
          correctLabel: 'Disable gradient tracking',
          explanation: 'no_grad() speeds things up \u2014 we don\u2019t need gradients when just evaluating.',
          deepDive: 'During a test you just want answers, not study notes. Turning off gradient tracking skips unnecessary bookkeeping and makes everything run faster.',
          deeperDive: 'torch.no_grad() is a context manager that disables gradient computation within its block. This reduces memory usage by roughly 50% because PyTorch no longer needs to store the intermediate activations required for backpropagation. It also makes forward passes slightly faster since no computation graph is built. You should always wrap evaluation code in no_grad(). Forgetting it will not cause wrong results, but it wastes memory and can cause out-of-memory errors on large test sets.',
          options: ['Disable gradient tracking', 'Initialize counters', 'Make predictions', 'Start training'],
        },
        {
          startLine: 4,
          endLine: 6,
          color: 'XRAY_MODEL',
          correctLabel: 'Predict on test batches',
          explanation: 'Run each test batch through the model. argmax(dim=1) picks the predicted class.',
          deepDive: 'Each batch of images goes through the model and comes out as a table of scores. argmax picks the highest score in each row, giving one predicted digit per image.',
          deeperDive: 'The scores tensor has shape [batch_size, 10] -- for example, [64, 10] means 64 images each with 10 class scores. argmax(dim=1) operates across columns (the 10 classes) independently for each row (each image), returning a tensor of shape [64] containing the predicted class index for each image. dim=0 would pick across rows instead, which is wrong here. If scores for one image are [0.1, -0.3, 2.5, 0.8, -0.1, 0.0, 0.2, 1.1, -0.4, 0.3], argmax(dim=1) returns 2 because index 2 has the highest value 2.5.',
          options: ['Predict on test batches', 'Initialize counters', 'Calculate accuracy', 'Train the model'],
        },
        {
          startLine: 7,
          endLine: 8,
          color: 'XRAY_TRAIN',
          correctLabel: 'Count correct predictions',
          explanation: 'Compare predicted vs. true labels, sum up matches, track total seen.',
          deepDive: 'Comparing predictions to the answer key gives a checklist of right and wrong. We count the checkmarks and add them to the running total.',
          deeperDive: '(preds == labels) performs element-wise comparison, creating a boolean tensor like tensor([True, False, True, True, ...]). Calling .sum() on a boolean tensor counts the True values (True = 1, False = 0), giving the number of correct predictions in this batch. The .item() call extracts the Python integer from the resulting single-element tensor. labels.size(0) returns the batch size (the first dimension), which is typically 64 but may be smaller for the last batch if the dataset size is not evenly divisible.',
          options: ['Count correct predictions', 'Make predictions', 'Disable gradients', 'Print results'],
        },
        {
          startLine: 10,
          endLine: 11,
          color: 'XRAY_PREDICT',
          correctLabel: 'Calculate and print accuracy',
          explanation: 'Divide correct by total. :.2% formats as a percentage like 97.50%.',
          deepDive: 'Divide right answers by total to get something like 0.975, then display it as 97.50%. A good digit-recognition model usually lands between 97% and 99%.',
          deeperDive: 'The format specifier :.2% multiplies the value by 100 and appends a percent sign, so 0.975 displays as "97.50%". A simple fully connected network (no convolutions) typically achieves about 97-98% on MNIST. Adding convolutional layers pushes accuracy to 99%+. The current state-of-the-art for MNIST is around 99.8%, achieved with deep convolutional networks and data augmentation. For comparison, human performance on MNIST is estimated at about 97.5%, which means even basic neural networks can match human digit recognition.',
          options: ['Calculate and print accuracy', 'Count correct', 'Make predictions', 'Initialize counters'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'counters',
          code: 'correct = 0\ntotal = 0',
          lines: [0, 1],
        },
        {
          id: 'no_grad',
          code: 'with torch.no_grad():',
          lines: [3],
        },
        {
          id: 'predict',
          code: '    for images, labels in test_loader:\n        scores = model(images)\n        preds = scores.argmax(dim=1)',
          lines: [4, 5, 6],
        },
        {
          id: 'compare',
          code: '        correct += (preds == labels).sum().item()\n        total += labels.size(0)',
          lines: [7, 8],
        },
        {
          id: 'accuracy',
          code: 'accuracy = correct / total\nprint(f"Accuracy: {accuracy:.2%}")',
          lines: [10, 11],
        },
      ],
    },

    rewire: {
      goal: 'Get top-3 predictions instead of just top-1',
      targets: [
        {
          line: 6,
          description: 'Change argmax to topk',
          currentCode: '        preds = scores.argmax(dim=1)',
          options: [
            { label: 'scores.topk(3, dim=1).indices', newCode: '        preds = scores.topk(3, dim=1).indices', correct: true },
            { label: 'scores.argmax(dim=0)', newCode: '        preds = scores.argmax(dim=0)', correct: false },
            { label: 'scores.max(dim=1)', newCode: '        preds = scores.max(dim=1)', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 3: Real Pipeline
  // ================================================================

  // LESSON 7: Datasets & Batches (NEW)
  {
    id: 'datasets_and_batches',
    name: 'Datasets & Batches',
    chapter: 2,
    description: 'Load real MNIST data with transforms and batching.',
    tracer: [
      { text: 'torchvision has built-in datasets.', viz: 'ds_mnist' },
      { text: 'Transforms preprocess each image.', viz: 'ds_transform' },
      { text: 'DataLoader serves data in batches.', viz: 'ds_loader' },
    ],
    code: [
      'from torchvision import datasets, transforms',
      '',
      'transform = transforms.Compose([',
      '    transforms.ToTensor(),',
      '    transforms.Normalize((0.5,), (0.5,))',
      '])',
      '',
      'train_data = datasets.MNIST("data",',
      '    train=True, download=True,',
      '    transform=transform)',
      '',
      'train_loader = DataLoader(train_data,',
      '    batch_size=64, shuffle=True)',
    ],

    xray: {
      pipeline: ['import', 'transforms', 'dataset', 'loader'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import data tools',
          explanation: 'torchvision provides datasets (MNIST, CIFAR) and transforms (ToTensor, Normalize).',
          deepDive: 'torchvision is a helper library for image tasks. It comes with popular datasets already built in and tools to preprocess images, so you do not have to do that work from scratch.',
          deeperDive: 'torchvision provides three main things: datasets (MNIST, CIFAR-10, ImageNet, and dozens more), transforms (resizing, cropping, flipping, color jittering for data augmentation), and pre-trained models (ResNet, VGG, EfficientNet that you can fine-tune). The transforms module is especially powerful for data augmentation -- you can randomly flip, rotate, or crop images during training to make your model more robust. There are also similar libraries for other domains: torchaudio for sound and torchtext for natural language processing.',
          options: ['Import data tools', 'Define transforms', 'Load dataset', 'Create data loader'],
        },
        {
          startLine: 2,
          endLine: 5,
          color: 'XRAY_DATA',
          correctLabel: 'Define preprocessing',
          explanation: 'Compose chains transforms. ToTensor converts pixels to 0\u20131 floats. Normalize centers values.',
          deepDive: 'Like a recipe with two prep steps: first convert the image to numbers, then center those numbers around zero. Centered data helps the model learn faster.',
          deeperDive: 'ToTensor() converts a PIL Image (height x width x channels, values 0-255) or a numpy array into a PyTorch float tensor (channels x height x width, values 0.0-1.0). Normalize((0.5,), (0.5,)) then applies the formula: output = (input - mean) / std, so with mean=0.5 and std=0.5 it maps [0, 1] to [-1, 1]. The single-element tuples (0.5,) indicate one channel (grayscale). For RGB images you would use Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5)). Centering data around zero helps gradient-based optimization converge faster because the loss landscape becomes more symmetric.',
          options: ['Define preprocessing', 'Import data tools', 'Load dataset', 'Create data loader'],
        },
        {
          startLine: 7,
          endLine: 9,
          color: 'XRAY_MODEL',
          correctLabel: 'Load MNIST dataset',
          explanation: 'Downloads 60,000 training images of handwritten digits, applying our transform.',
          deepDive: 'This downloads 60,000 handwritten digit images into a folder on your computer. Each image gets preprocessed automatically using the transform you defined above.',
          deeperDive: 'train=True loads the training split with 60,000 images; train=False loads the test split with 10,000 images. The download=True flag downloads the data the first time, then uses the cached version on subsequent runs -- it checks if the files already exist in the "data" directory. Each item in the dataset is a (image_tensor, label_integer) pair, where the label is 0-9. You can access individual samples with train_data[0], which returns a tuple like (tensor of shape [1, 28, 28], 5). The first dimension 1 represents one grayscale channel.',
          options: ['Load MNIST dataset', 'Define preprocessing', 'Create data loader', 'Import data tools'],
        },
        {
          startLine: 11,
          endLine: 12,
          color: 'XRAY_TRAIN',
          correctLabel: 'Create batched loader',
          explanation: 'DataLoader serves 64 images at a time (batch_size). shuffle randomizes order each epoch.',
          deepDive: 'The DataLoader is like a waiter bringing plates of food 64 at a time instead of dumping the whole kitchen on the table. Shuffling the order each round keeps the model from just memorizing the sequence.',
          deeperDive: 'DataLoader also supports num_workers=4 to load data in parallel using multiple CPU processes, which can significantly speed up training when data preprocessing is the bottleneck. The drop_last=True option discards the final incomplete batch if the dataset size is not evenly divisible by batch_size (for example, 60,000 / 64 leaves a remainder of 32). Shuffling is important for training because if images arrive in order (all 0s, then all 1s, etc.), the model would see biased batches and learn poorly. For test/evaluation loaders, shuffle is typically set to False since order does not matter.',
          options: ['Create batched loader', 'Load MNIST dataset', 'Define preprocessing', 'Import data tools'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'from torchvision import datasets, transforms',
          lines: [0],
        },
        {
          id: 'transforms',
          code: 'transform = transforms.Compose([\n    transforms.ToTensor(),\n    transforms.Normalize((0.5,), (0.5,))\n])',
          lines: [2, 3, 4, 5],
        },
        {
          id: 'dataset',
          code: 'train_data = datasets.MNIST("data",\n    train=True, download=True,\n    transform=transform)',
          lines: [7, 8, 9],
        },
        {
          id: 'loader',
          code: 'train_loader = DataLoader(train_data,\n    batch_size=64, shuffle=True)',
          lines: [11, 12],
        },
      ],
    },

    rewire: {
      goal: 'Use batch size 128 and disable shuffling',
      targets: [
        {
          line: 12,
          description: 'Change batch size and shuffle',
          currentCode: '    batch_size=64, shuffle=True)',
          options: [
            { label: 'batch_size=128, shuffle=False', newCode: '    batch_size=128, shuffle=False)', correct: true },
            { label: 'batch_size=128, shuffle=True', newCode: '    batch_size=128, shuffle=True)', correct: false },
            { label: 'batch_size=64, shuffle=False', newCode: '    batch_size=64, shuffle=False)', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 8: Convolutional Nets (NEW)
  {
    id: 'convolutional_nets',
    name: 'Convolutional Nets',
    chapter: 2,
    description: 'Use convolutions to see spatial patterns.',
    tracer: [
      { text: 'A filter slides over the image.', viz: 'cnn_filter' },
      { text: 'Pooling shrinks the feature map.', viz: 'cnn_pool' },
      { text: 'Flatten converts 2D features to 1D.', viz: 'cnn_flatten' },
      { text: 'CNNs outperform flat networks on images.', viz: 'cnn_compare' },
    ],
    code: [
      'import torch.nn as nn',
      '',
      'model = nn.Sequential(',
      '    nn.Conv2d(1, 16, kernel_size=3, padding=1),',
      '    nn.ReLU(),',
      '    nn.MaxPool2d(2),',
      '    nn.Flatten(),',
      '    nn.Linear(16 * 14 * 14, 10)',
      ')',
    ],

    xray: {
      pipeline: ['import', 'Conv2d\n+ ReLU', 'MaxPool', 'Flatten\n+ Linear'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import neural network tools',
          explanation: 'Same nn module, now with convolutional layers.',
          deepDive: 'Same toolbox as before. It already has convolutional layers inside, so no extra imports are needed to build a more advanced image model.',
          deeperDive: 'The torch.nn module contains both the simple layers you have already seen (Linear, ReLU) and convolutional layers (Conv2d, MaxPool2d, Flatten) all in one package. Conv2d applies sliding filters to 2D images, MaxPool2d downsamples feature maps, and Flatten converts multi-dimensional tensors to 1D. You do not need any additional imports -- nn is a comprehensive module with over 100 layer types, covering everything from basic fully connected networks to complex architectures like transformers and recurrent networks.',
          options: ['Import neural network tools', 'Define convolution', 'Pool features', 'Flatten output'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Convolution + activation',
          explanation: 'Conv2d slides 16 filters of size 3\u00D73 over the image. ReLU adds non-linearity.',
          deepDive: 'Imagine 16 tiny magnifying glasses, each 3x3 pixels, sliding over the image looking for different patterns like edges or curves. That is what the convolution filters do.',
          deeperDive: 'Conv2d(1, 16, 3, padding=1) has four key arguments: 1 input channel (grayscale), 16 output channels (16 different filters), kernel_size=3 (each filter is 3x3 pixels), and padding=1 (adds a 1-pixel border of zeros so the output stays 28x28 instead of shrinking to 26x26). The total parameter count is 1 * 16 * 3 * 3 + 16 = 160 (weights plus biases), which is far fewer than Linear\'s 100,480. This efficiency comes from weight sharing -- each filter uses the same 9 weights everywhere it slides across the image, which also makes CNNs naturally good at detecting patterns regardless of where they appear.',
          options: ['Convolution + activation', 'Pooling layer', 'Flatten + classify', 'Import tools'],
        },
        {
          startLine: 5,
          endLine: 5,
          color: 'XRAY_MODEL',
          correctLabel: 'Downsample with max pooling',
          explanation: 'MaxPool2d(2) halves each dimension: 28\u00D728 \u2192 14\u00D714. Keeps the strongest signals.',
          deepDive: 'Pooling looks at every small 2x2 square and keeps only the brightest value. This shrinks the image in half, keeping important details while tossing out the extra.',
          deeperDive: 'MaxPool2d(2) uses a 2x2 window with stride 2 (the default stride equals the kernel size). It slides across each feature map, taking the maximum value in each 2x2 block, so a 28x28 map becomes 14x14. This has zero learnable parameters -- it is purely a fixed operation. Max pooling provides a form of translation invariance: if a feature shifts by 1 pixel, the same max value is often still selected. An alternative is AvgPool2d, which takes the average instead of the max, but max pooling tends to work better because it preserves the strongest activations.',
          options: ['Downsample with max pooling', 'Convolution layer', 'Flatten output', 'Output layer'],
        },
        {
          startLine: 6,
          endLine: 7,
          color: 'XRAY_PREDICT',
          correctLabel: 'Flatten + classify',
          explanation: 'Flatten reshapes 16\u00D714\u00D714 into 3136. Linear maps to 10 digit classes.',
          deepDive: 'After scanning and shrinking, we have a stack of small feature maps. Flatten lines them all up into one list, then the final layer picks one of 10 digits -- same finish line as the simple model.',
          deeperDive: 'After the Conv2d produces 16 feature maps of 28x28, and MaxPool2d shrinks them to 14x14, you have a tensor of shape [batch_size, 16, 14, 14]. That is 16 * 14 * 14 = 3,136 values per image. nn.Flatten() reshapes this to [batch_size, 3136], dropping the spatial dimensions. Then nn.Linear(3136, 10) maps those 3,136 features to 10 class scores, exactly like the simple model\'s output layer. The key difference is that the 3,136 features here encode spatial patterns (edges, curves, loops) rather than raw pixel values, which is why CNNs outperform fully connected networks on image tasks.',
          options: ['Flatten + classify', 'Convolution layer', 'Pooling layer', 'Import tools'],
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
          id: 'sequential',
          code: 'model = nn.Sequential(',
          lines: [2],
        },
        {
          id: 'conv_relu',
          code: '    nn.Conv2d(1, 16, kernel_size=3, padding=1),\n    nn.ReLU(),',
          lines: [3, 4],
        },
        {
          id: 'pool',
          code: '    nn.MaxPool2d(2),',
          lines: [5],
        },
        {
          id: 'flatten_linear',
          code: '    nn.Flatten(),\n    nn.Linear(16 * 14 * 14, 10)\n)',
          lines: [6, 7, 8],
        },
      ],
    },

    rewire: {
      goal: 'Use 32 filters instead of 16',
      targets: [
        {
          line: 3,
          description: 'Change the number of filters',
          currentCode: '    nn.Conv2d(1, 16, kernel_size=3, padding=1),',
          options: [
            { label: 'nn.Conv2d(1, 32, ...)', newCode: '    nn.Conv2d(1, 32, kernel_size=3, padding=1),', correct: true },
            { label: 'nn.Conv2d(1, 8, ...)', newCode: '    nn.Conv2d(1, 8, kernel_size=3, padding=1),', correct: false },
            { label: 'nn.Conv2d(16, 32, ...)', newCode: '    nn.Conv2d(16, 32, kernel_size=3, padding=1),', correct: false },
          ],
        },
        {
          line: 7,
          description: 'Update Linear input to match new filter count',
          currentCode: '    nn.Linear(16 * 14 * 14, 10)',
          options: [
            { label: 'nn.Linear(32 * 14 * 14, 10)', newCode: '    nn.Linear(32 * 14 * 14, 10)', correct: true },
            { label: 'nn.Linear(16 * 14 * 14, 10)', newCode: '    nn.Linear(16 * 14 * 14, 10)', correct: false },
            { label: 'nn.Linear(32 * 28 * 28, 10)', newCode: '    nn.Linear(32 * 28 * 28, 10)', correct: false },
          ],
        },
      ],
    },
  },
];
