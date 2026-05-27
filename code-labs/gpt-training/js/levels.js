// ============================================================
// LEVELS — 8 Lessons across 3 Chapters with X-Ray / Assemble / Rewire rounds
// ============================================================

export const LEVELS = [
  // ================================================================
  // CHAPTER 1: Training LMs
  // ================================================================

  // LESSON 1: Training Data
  {
    id: 'training_data',
    name: 'Training Data',
    chapter: 0,
    description: 'Tokens, inputs, and targets for language model training.',
    tracer: [
      { text: 'Text is converted into a sequence of token IDs.', viz: 'td_tokens' },
      { text: 'Inputs are all tokens except the last.', viz: 'td_inputs' },
      { text: 'Targets are all tokens except the first.', viz: 'td_targets' },
      { text: 'The model learns to predict the next token.', viz: 'td_shift' },
    ],
    code: [
      'import torch',
      '',
      'tokens = torch.tensor([0, 1, 2, 3, 4, 5])',
      '',
      'inputs  = tokens[:-1]',
      'targets = tokens[1:]',
      '',
      'print(inputs)',
      'print(targets)',
    ],

    xray: {
      pipeline: ['import', 'tokens', 'inputs\n[:-1]', 'targets\n[1:]'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import PyTorch',
          explanation: 'torch provides tensor operations needed for data manipulation.',
          deepDive: 'PyTorch is the foundation library. We need it here to create tensors from our token lists and to do slicing operations.',
          deeperDive: 'The torch package provides the tensor data structure, which is similar to a NumPy array but with two key advantages: it can run on GPUs for massive parallelism, and it supports automatic differentiation for training neural networks. When you import torch, you get access to tensor creation functions (torch.tensor, torch.zeros, torch.rand), mathematical operations (+, -, matmul), and slicing syntax identical to Python lists and NumPy arrays.',
          options: ['Import PyTorch', 'Define tokens', 'Create inputs', 'Create targets'],
        },
        {
          startLine: 2,
          endLine: 2,
          color: 'XRAY_DATA',
          correctLabel: 'Define token sequence',
          explanation: 'A sequence of integer token IDs representing text, like word indices in a vocabulary.',
          deepDive: 'Each number represents a word or subword in the vocabulary. For example, 0 might be "the", 1 might be "cat", etc. Real tokenizers like GPT-2 have vocabularies of 50,257 tokens.',
          deeperDive: 'In practice, text is converted to token IDs by a tokenizer like BPE (Byte Pair Encoding). GPT-2 uses a vocabulary of 50,257 tokens. Each token can represent a whole word ("hello"), a subword ("ing"), or even a single character. The torch.tensor() call converts a Python list of integers into a 1D tensor of shape [6]. The dtype defaults to torch.int64 (long) because the input values are integers. Token IDs are always non-negative integers indexing into an embedding matrix.',
          options: ['Define token sequence', 'Import PyTorch', 'Split into inputs', 'Split into targets'],
        },
        {
          startLine: 4,
          endLine: 5,
          color: 'XRAY_PREDICT',
          correctLabel: 'Create input-target pairs',
          explanation: 'inputs = all but last token; targets = all but first. Each input predicts its corresponding target.',
          deepDive: 'This shift-by-one trick is the core of language model training. Position i in inputs should predict position i in targets. So token 0 predicts token 1, token 1 predicts token 2, and so on.',
          deeperDive: 'tokens[:-1] uses Python slice notation: start at the beginning, stop one before the end. For [0,1,2,3,4,5], this gives [0,1,2,3,4]. tokens[1:] starts at index 1 and goes to the end, giving [1,2,3,4,5]. These two tensors are aligned: inputs[i] should predict targets[i]. This is called "teacher forcing" -- during training, we always feed the correct previous token as input, not the model\'s own prediction. The number of training examples from a sequence of length N is N-1.',
          options: ['Create input-target pairs', 'Define token sequence', 'Import PyTorch', 'Print the results'],
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
          id: 'tokens',
          code: 'tokens = torch.tensor([0, 1, 2, 3, 4, 5])',
          lines: [2],
        },
        {
          id: 'split',
          code: 'inputs  = tokens[:-1]\ntargets = tokens[1:]',
          lines: [4, 5],
        },
      ],
    },

    rewire: {
      goal: 'Use only the first 4 tokens',
      targets: [
        {
          line: 2,
          description: 'Change the token sequence',
          currentCode: 'tokens = torch.tensor([0, 1, 2, 3, 4, 5])',
          options: [
            { label: 'torch.tensor([0, 1, 2, 3])', newCode: 'tokens = torch.tensor([0, 1, 2, 3])', correct: true },
            { label: 'torch.tensor([0, 1, 2, 3, 4])', newCode: 'tokens = torch.tensor([0, 1, 2, 3, 4])', correct: false },
            { label: 'torch.tensor([4, 5])', newCode: 'tokens = torch.tensor([4, 5])', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 2: Language Model Loss
  {
    id: 'language_model_loss',
    name: 'Language Model Loss',
    chapter: 0,
    description: 'Measure prediction error with cross-entropy loss.',
    tracer: [
      { text: 'The model outputs logits for each vocabulary token.', viz: 'lm_logits' },
      { text: 'CrossEntropyLoss compares logits to true targets.', viz: 'lm_ce' },
      { text: 'Loss is high when the model guesses wrong.', viz: 'lm_high_loss' },
      { text: 'Loss drops as predictions improve.', viz: 'lm_low_loss' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      '',
      'vocab_size = 100',
      'logits = torch.randn(5, vocab_size)',
      'targets = torch.tensor([1, 2, 3, 4, 5])',
      '',
      'loss_fn = nn.CrossEntropyLoss()',
      'loss = loss_fn(logits, targets)',
      'print(loss.item())',
    ],

    xray: {
      pipeline: ['imports', 'logits', 'targets', 'loss_fn', 'loss'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensors, nn for the loss function.',
          deepDive: 'We need torch to create tensors (logits and targets) and nn to access CrossEntropyLoss, a built-in loss function designed for classification tasks like next-token prediction.',
          deeperDive: 'torch.nn contains neural network building blocks including loss functions. CrossEntropyLoss is specifically designed for multi-class classification where the target is a class index (not a one-hot vector). It internally applies log_softmax to the logits and then computes the negative log likelihood, combining two steps into one numerically stable operation.',
          options: ['Import libraries', 'Create logits', 'Define loss function', 'Compute loss'],
        },
        {
          startLine: 3,
          endLine: 5,
          color: 'XRAY_DATA',
          correctLabel: 'Create logits and targets',
          explanation: 'logits are raw model outputs (5 positions, 100 vocab). targets are the correct token IDs.',
          deepDive: 'Logits have shape [5, 100] meaning 5 token positions, each with 100 scores (one per vocabulary word). The targets tensor says which of the 100 words is correct at each position.',
          deeperDive: 'torch.randn(5, 100) generates a 5x100 matrix of random values from a standard normal distribution (mean=0, std=1), simulating untrained model outputs. Each row contains 100 logit scores for one position. The targets tensor [1,2,3,4,5] contains the true token indices. CrossEntropyLoss expects logits of shape [N, C] and targets of shape [N], where N is batch/sequence length and C is number of classes. For a real GPT-2 model, C would be 50,257.',
          options: ['Create logits and targets', 'Import libraries', 'Define loss function', 'Compute loss'],
        },
        {
          startLine: 7,
          endLine: 9,
          color: 'XRAY_TRAIN',
          correctLabel: 'Compute cross-entropy loss',
          explanation: 'CrossEntropyLoss measures how far the logits are from correctly predicting the targets.',
          deepDive: 'The loss function takes the raw scores and the correct answers, and returns a single number. Lower means the model is more confident about the right answers. For random logits with 100 classes, expect a loss around ln(100) = 4.6.',
          deeperDive: 'CrossEntropyLoss computes: loss = -log(softmax(logits)[target_class]) averaged over all positions. For random logits with vocab_size=100, the expected loss is -log(1/100) = log(100) = 4.605. If the model perfectly predicts every token with probability 1.0, the loss would be -log(1) = 0. The .item() call extracts the Python float from the 0-dimensional loss tensor, which is necessary for printing or logging without keeping the computation graph in memory.',
          options: ['Compute cross-entropy loss', 'Create logits and targets', 'Import libraries', 'Print output'],
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
          code: 'vocab_size = 100\nlogits = torch.randn(5, vocab_size)\ntargets = torch.tensor([1, 2, 3, 4, 5])',
          lines: [3, 4, 5],
        },
        {
          id: 'loss',
          code: 'loss_fn = nn.CrossEntropyLoss()\nloss = loss_fn(logits, targets)\nprint(loss.item())',
          lines: [7, 8, 9],
        },
      ],
    },

    rewire: {
      goal: 'Use a vocabulary of 50257 (GPT-2 size)',
      targets: [
        {
          line: 3,
          description: 'Change the vocabulary size',
          currentCode: 'vocab_size = 100',
          options: [
            { label: 'vocab_size = 50257', newCode: 'vocab_size = 50257', correct: true },
            { label: 'vocab_size = 256', newCode: 'vocab_size = 256', correct: false },
            { label: 'vocab_size = 1000', newCode: 'vocab_size = 1000', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 3: Training Loop
  {
    id: 'training_loop',
    name: 'Training Loop',
    chapter: 0,
    description: 'Train a language model with optimizer, loss, and epochs.',
    tracer: [
      { text: 'Create a model, optimizer, and loss function.', viz: 'tl_setup' },
      { text: 'Each epoch: forward pass, compute loss.', viz: 'tl_forward' },
      { text: 'Backward pass computes gradients.', viz: 'tl_backward' },
      { text: 'Loss decreases over training epochs.', viz: 'tl_curve' },
    ],
    code: [
      'model = nn.Embedding(vocab_size, 64)',
      'optimizer = torch.optim.Adam(model.parameters(), lr=0.01)',
      'loss_fn = nn.CrossEntropyLoss()',
      '',
      'for epoch in range(10):',
      '    logits = model(inputs)',
      '    loss = loss_fn(logits, targets)',
      '',
      '    optimizer.zero_grad()',
      '    loss.backward()',
      '    optimizer.step()',
      '    print(f"Epoch {epoch}: {loss.item():.4f}")',
    ],

    xray: {
      pipeline: ['model', 'optimizer\n+ loss_fn', 'forward', 'backward\n+ step'],
      regions: [
        {
          startLine: 0,
          endLine: 2,
          color: 'XRAY_MODEL',
          correctLabel: 'Setup model, optimizer, loss',
          explanation: 'Embedding maps tokens to vectors. Adam optimizes weights. CrossEntropyLoss measures error.',
          deepDive: 'The embedding layer is a lookup table that converts each token ID into a 64-dimensional vector. Adam adjusts these vectors to minimize the cross-entropy loss between predictions and targets.',
          deeperDive: 'nn.Embedding(vocab_size, 64) creates a matrix of shape [vocab_size, 64] where each row is a learnable vector for one token. When you pass token ID 3, it returns row 3. This is mathematically equivalent to multiplying a one-hot vector by the weight matrix, but much faster because it skips the multiplication and does a direct lookup. Adam is preferred over SGD for language models because its adaptive learning rates handle the sparse gradient updates from embeddings well.',
          options: ['Setup model, optimizer, loss', 'Run forward pass', 'Compute gradients', 'Print results'],
        },
        {
          startLine: 4,
          endLine: 6,
          color: 'XRAY_DATA',
          correctLabel: 'Forward pass and loss',
          explanation: 'Pass inputs through the model to get logits, then compute how wrong the predictions are.',
          deepDive: 'The model converts input tokens into logit scores. The loss function then checks these scores against the true targets. A high loss means the model is far from correct predictions.',
          deeperDive: 'model(inputs) runs the forward pass: each input token ID is looked up in the embedding table, producing a tensor of shape [seq_len, 64]. The loss function expects shape [N, C] for logits and [N] for targets, where C is the number of classes. In this simplified example, the embedding dimension (64) serves as the logit dimension. In a full GPT model, a final linear projection would map from the hidden size to vocab_size.',
          options: ['Forward pass and loss', 'Setup model', 'Backward pass', 'Print results'],
        },
        {
          startLine: 8,
          endLine: 11,
          color: 'XRAY_TRAIN',
          correctLabel: 'Backward pass and update',
          explanation: 'zero_grad clears old gradients, backward computes new ones, step updates weights.',
          deepDive: 'This is the standard three-step training recipe: (1) clear leftover gradients, (2) compute fresh gradients from the loss, (3) nudge the weights in the direction that reduces loss.',
          deeperDive: 'optimizer.zero_grad() sets all parameter gradients to zero. Without this, gradients accumulate across iterations, causing incorrect updates. loss.backward() uses the chain rule (backpropagation) to compute d(loss)/d(param) for every parameter and stores it in param.grad. optimizer.step() applies the Adam update rule: it adjusts each weight based on its gradient, momentum, and adaptive learning rate. The print statement uses loss.item() to extract the scalar value, avoiding memory leaks from keeping the computation graph alive.',
          options: ['Backward pass and update', 'Forward pass', 'Setup model', 'Define tokens'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'setup',
          code: 'model = nn.Embedding(vocab_size, 64)\noptimizer = torch.optim.Adam(model.parameters(), lr=0.01)\nloss_fn = nn.CrossEntropyLoss()',
          lines: [0, 1, 2],
        },
        {
          id: 'forward',
          code: 'for epoch in range(10):\n    logits = model(inputs)\n    loss = loss_fn(logits, targets)',
          lines: [4, 5, 6],
        },
        {
          id: 'backward',
          code: '    optimizer.zero_grad()\n    loss.backward()\n    optimizer.step()\n    print(f"Epoch {epoch}: {loss.item():.4f}")',
          lines: [8, 9, 10, 11],
        },
      ],
    },

    rewire: {
      goal: 'Use SGD optimizer with learning rate 0.001',
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

  // ================================================================
  // CHAPTER 2: Text Generation
  // ================================================================

  // LESSON 4: Greedy Decoding
  {
    id: 'greedy_decoding',
    name: 'Greedy Decoding',
    chapter: 1,
    description: 'Generate text by always picking the most likely next token.',
    tracer: [
      { text: 'Start with a prompt sequence of tokens.', viz: 'gd_prompt' },
      { text: 'The model predicts scores for the next token.', viz: 'gd_scores' },
      { text: 'argmax picks the highest-scoring token.', viz: 'gd_argmax' },
      { text: 'Append and repeat to generate text.', viz: 'gd_loop' },
    ],
    code: [
      'def greedy_decode(model, prompt, max_len=20):',
      '    tokens = prompt.clone()',
      '    for _ in range(max_len):',
      '        logits = model(tokens)',
      '        next_logit = logits[-1]',
      '        next_token = next_logit.argmax()',
      '        tokens = torch.cat([tokens, next_token.unsqueeze(0)])',
      '    return tokens',
    ],

    xray: {
      pipeline: ['def', 'clone\nprompt', 'forward', 'argmax', 'cat'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Function setup and clone prompt',
          explanation: 'Define the function. Clone the prompt so the original is not modified.',
          deepDive: 'clone() makes a copy of the prompt tensor. Without it, appending tokens inside the loop would also modify the original prompt outside the function.',
          deeperDive: 'In PyTorch, tensor assignment does not copy data -- it creates a view that shares the same memory. So tokens = prompt would mean that modifying tokens (via torch.cat) would not actually change the original since cat creates new tensors, but clone() is still best practice for clarity. The function signature uses max_len=20 as a default argument, meaning it generates up to 20 new tokens unless the caller specifies otherwise.',
          options: ['Function setup and clone prompt', 'Run the model', 'Pick the top token', 'Append and loop'],
        },
        {
          startLine: 2,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Forward pass on full sequence',
          explanation: 'Feed all tokens so far into the model. Take the logits from the last position.',
          deepDive: 'The model processes the entire sequence and produces logits at every position, but we only care about the last position\'s logits because that predicts the next token to generate.',
          deeperDive: 'logits[-1] selects the last row of the output tensor, which has shape [vocab_size]. This row contains the model\'s prediction for what comes after the entire input sequence. In a transformer-based model, each position attends to all previous positions via causal masking, so the last position has the most context and makes the best prediction. Earlier positions\' logits predict the token after them, which is useful during training but not during generation.',
          options: ['Forward pass on full sequence', 'Function setup', 'Pick argmax', 'Concatenate tokens'],
        },
        {
          startLine: 5,
          endLine: 6,
          color: 'XRAY_PREDICT',
          correctLabel: 'Pick top token and append',
          explanation: 'argmax selects the most likely token. cat appends it to the growing sequence.',
          deepDive: 'argmax() returns the index of the highest score -- the "greediest" choice. unsqueeze(0) adds a dimension so it can be concatenated with the existing 1D sequence. The sequence grows by one token each iteration.',
          deeperDive: 'argmax() returns a 0-dimensional tensor (scalar), but torch.cat requires all tensors to have the same number of dimensions. unsqueeze(0) converts the scalar tensor of shape [] to shape [1], matching the 1D shape of tokens. torch.cat([tokens, next_token.unsqueeze(0)]) joins the two 1D tensors along dimension 0, creating a new tensor that is one element longer. This "greedy" strategy always picks the single most likely token, which can lead to repetitive or boring text because it never explores less probable but potentially interesting continuations.',
          options: ['Pick top token and append', 'Forward pass', 'Clone prompt', 'Define function'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'def',
          code: 'def greedy_decode(model, prompt, max_len=20):\n    tokens = prompt.clone()',
          lines: [0, 1],
        },
        {
          id: 'forward',
          code: '    for _ in range(max_len):\n        logits = model(tokens)\n        next_logit = logits[-1]',
          lines: [2, 3, 4],
        },
        {
          id: 'pick',
          code: '        next_token = next_logit.argmax()\n        tokens = torch.cat([tokens, next_token.unsqueeze(0)])\n    return tokens',
          lines: [5, 6, 7],
        },
      ],
    },

    rewire: {
      goal: 'Generate up to 50 tokens instead of 20',
      targets: [
        {
          line: 0,
          description: 'Change max generation length',
          currentCode: 'def greedy_decode(model, prompt, max_len=20):',
          options: [
            { label: 'max_len=50', newCode: 'def greedy_decode(model, prompt, max_len=50):', correct: true },
            { label: 'max_len=10', newCode: 'def greedy_decode(model, prompt, max_len=10):', correct: false },
            { label: 'max_len=100', newCode: 'def greedy_decode(model, prompt, max_len=100):', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 5: Temperature Sampling
  {
    id: 'temperature_sampling',
    name: 'Temperature Sampling',
    chapter: 1,
    description: 'Control randomness by scaling logits before sampling.',
    tracer: [
      { text: 'Raw logits are the model\'s confidence scores.', viz: 'ts_logits' },
      { text: 'Dividing by temperature changes the distribution.', viz: 'ts_scale' },
      { text: 'Softmax converts scaled logits to probabilities.', viz: 'ts_softmax' },
      { text: 'multinomial samples a token from the distribution.', viz: 'ts_sample' },
    ],
    code: [
      'import torch',
      'import torch.nn.functional as F',
      '',
      'logits = model(tokens)[-1]',
      'temperature = 0.8',
      '',
      'scaled = logits / temperature',
      'probs = F.softmax(scaled, dim=-1)',
      'next_token = torch.multinomial(probs, 1)',
    ],

    xray: {
      pipeline: ['imports', 'logits', 'scale\n/ temp', 'softmax', 'sample'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import torch and F',
          explanation: 'F (torch.nn.functional) has softmax and other stateless operations.',
          deepDive: 'torch.nn.functional provides functions like softmax that do not have learnable parameters. We alias it as F for brevity, which is a universal convention in PyTorch code.',
          deeperDive: 'torch.nn.functional (commonly imported as F) contains the same operations as the nn.Module classes but as plain functions rather than objects. F.softmax(x, dim=-1) is equivalent to nn.Softmax(dim=-1)(x). The functional form is preferred when you do not need to store the operation as a layer in a model. Other common functions include F.relu, F.cross_entropy, F.dropout, and F.log_softmax.',
          options: ['Import torch and F', 'Get logits', 'Scale by temperature', 'Sample a token'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Get logits and set temperature',
          explanation: 'Take logits from the last position. Temperature controls randomness: <1 = sharper, >1 = flatter.',
          deepDive: 'Temperature 0.8 makes the distribution slightly sharper than normal, favoring the top tokens more. Temperature 1.0 is neutral. Temperature 2.0 would make the distribution almost uniform, picking tokens nearly at random.',
          deeperDive: 'The temperature parameter comes from statistical mechanics (the Boltzmann distribution). Dividing logits by temperature before softmax is equivalent to raising the original probabilities to the power 1/temperature and re-normalizing. As temperature approaches 0, the distribution becomes a one-hot vector on the argmax (greedy decoding). As temperature approaches infinity, the distribution becomes uniform. Common values are 0.7-1.0 for coherent text and 1.2-1.5 for creative but sometimes incoherent text.',
          options: ['Get logits and set temperature', 'Import libraries', 'Compute probabilities', 'Sample next token'],
        },
        {
          startLine: 6,
          endLine: 8,
          color: 'XRAY_PREDICT',
          correctLabel: 'Scale, softmax, and sample',
          explanation: 'Divide logits by temperature, convert to probabilities, then randomly sample one token.',
          deepDive: 'First we scale the logits (dividing makes high scores even higher relative to low scores). Then softmax converts to probabilities that sum to 1. Finally, multinomial randomly picks one token index according to those probabilities.',
          deeperDive: 'The three-step process: (1) scaled = logits / 0.8 amplifies differences between logit values. (2) F.softmax(scaled, dim=-1) applies exp(x_i) / sum(exp(x_j)) to convert to a proper probability distribution. (3) torch.multinomial(probs, 1) draws 1 sample from the categorical distribution defined by probs. The result is a tensor containing the sampled token index. Unlike argmax which always picks the same token, multinomial introduces controlled randomness, making generated text more varied and natural.',
          options: ['Scale, softmax, and sample', 'Get logits', 'Import libraries', 'Set temperature'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'imports',
          code: 'import torch\nimport torch.nn.functional as F',
          lines: [0, 1],
        },
        {
          id: 'logits',
          code: 'logits = model(tokens)[-1]\ntemperature = 0.8',
          lines: [3, 4],
        },
        {
          id: 'sample',
          code: 'scaled = logits / temperature\nprobs = F.softmax(scaled, dim=-1)\nnext_token = torch.multinomial(probs, 1)',
          lines: [6, 7, 8],
        },
      ],
    },

    rewire: {
      goal: 'Use temperature 1.5 for more creative output',
      targets: [
        {
          line: 4,
          description: 'Change the temperature value',
          currentCode: 'temperature = 0.8',
          options: [
            { label: 'temperature = 1.5', newCode: 'temperature = 1.5', correct: true },
            { label: 'temperature = 0.1', newCode: 'temperature = 0.1', correct: false },
            { label: 'temperature = 0.8', newCode: 'temperature = 0.8', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 6: Top-k Sampling
  {
    id: 'topk_sampling',
    name: 'Top-k Sampling',
    chapter: 1,
    description: 'Limit sampling to the k most likely tokens.',
    tracer: [
      { text: 'Start with logits for the full vocabulary.', viz: 'tk_full' },
      { text: 'torch.topk selects the k highest scores.', viz: 'tk_topk' },
      { text: 'Set all other logits to negative infinity.', viz: 'tk_filter' },
      { text: 'Sample from the filtered distribution.', viz: 'tk_sample' },
    ],
    code: [
      'import torch',
      'import torch.nn.functional as F',
      '',
      'logits = model(tokens)[-1]',
      'k = 10',
      '',
      'top_values, top_indices = torch.topk(logits, k)',
      'filtered = torch.full_like(logits, float("-inf"))',
      'filtered.scatter_(0, top_indices, top_values)',
      '',
      'probs = F.softmax(filtered, dim=-1)',
      'next_token = torch.multinomial(probs, 1)',
    ],

    xray: {
      pipeline: ['imports', 'logits', 'topk', 'filter\n+ scatter', 'sample'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensor ops, F for softmax.',
          deepDive: 'Same imports as temperature sampling. We need torch for topk and tensor creation, and F for the softmax function.',
          deeperDive: 'torch.topk is a built-in function that efficiently finds the k largest values in a tensor without fully sorting it (O(n + k log k) complexity). torch.full_like creates a new tensor with the same shape and dtype as the input but filled with a specified value. F.softmax and torch.multinomial work the same as in temperature sampling.',
          options: ['Import libraries', 'Get model logits', 'Select top-k', 'Filter and sample'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Get logits and set k',
          explanation: 'Get the last position\'s logits. k=10 means we only consider the 10 most likely tokens.',
          deepDive: 'With k=10, we ignore 99% of the vocabulary (assuming vocab_size=100). This prevents the model from sampling very unlikely tokens that could produce nonsense text.',
          deeperDive: 'The value of k controls the tradeoff between diversity and quality. k=1 is equivalent to greedy decoding (always pick the best). k=10-50 is typical for high-quality text generation. k=vocab_size disables top-k filtering entirely, equivalent to pure temperature sampling. GPT-2 and GPT-3 papers commonly use k=40. Smaller k produces more focused, predictable text; larger k allows more variety but risks incoherent output.',
          options: ['Get logits and set k', 'Import libraries', 'Filter logits', 'Sample from distribution'],
        },
        {
          startLine: 6,
          endLine: 8,
          color: 'XRAY_MODEL',
          correctLabel: 'Select top-k and filter',
          explanation: 'topk returns the 10 highest values and their positions. scatter_ places them into a -inf tensor.',
          deepDive: 'First, topk finds the 10 best token scores. Then we create a tensor of all -inf values (which softmax will turn into 0 probability). scatter_ puts the top-10 scores back into their original positions, so only those 10 tokens have a chance of being sampled.',
          deeperDive: 'torch.topk(logits, k) returns two tensors: values (the k largest logit scores, sorted descending) and indices (their original positions in the logits tensor). torch.full_like(logits, float("-inf")) creates a tensor of the same shape filled with negative infinity. After softmax, exp(-inf) = 0, so those positions get zero probability. scatter_(0, top_indices, top_values) is an in-place operation that writes top_values into filtered at the positions specified by top_indices, effectively restoring only the top-k logits while leaving everything else at -inf.',
          options: ['Select top-k and filter', 'Import libraries', 'Get logits', 'Sample next token'],
        },
        {
          startLine: 10,
          endLine: 11,
          color: 'XRAY_PREDICT',
          correctLabel: 'Sample from filtered distribution',
          explanation: 'softmax converts filtered logits to probabilities (non-top-k tokens get 0). multinomial samples one.',
          deepDive: 'After filtering, only 10 tokens have non-zero probability. softmax normalizes them to sum to 1, and multinomial picks one. This guarantees we only generate from the model\'s top choices.',
          deeperDive: 'When softmax is applied to the filtered tensor, exp(-inf) = 0 for all non-top-k positions. The remaining k positions get exp(logit_i) / sum(exp(top_k_logits)), which sums to 1.0. torch.multinomial(probs, 1) then samples from this truncated distribution. The key advantage over pure temperature sampling is that top-k completely eliminates the long tail of unlikely tokens. You can also combine top-k with temperature: first filter to top-k, then apply temperature scaling to the surviving logits before softmax.',
          options: ['Sample from filtered distribution', 'Select top-k', 'Get logits', 'Import libraries'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'imports',
          code: 'import torch\nimport torch.nn.functional as F',
          lines: [0, 1],
        },
        {
          id: 'logits',
          code: 'logits = model(tokens)[-1]\nk = 10',
          lines: [3, 4],
        },
        {
          id: 'filter',
          code: 'top_values, top_indices = torch.topk(logits, k)\nfiltered = torch.full_like(logits, float("-inf"))\nfiltered.scatter_(0, top_indices, top_values)',
          lines: [6, 7, 8],
        },
        {
          id: 'sample',
          code: 'probs = F.softmax(filtered, dim=-1)\nnext_token = torch.multinomial(probs, 1)',
          lines: [10, 11],
        },
      ],
    },

    rewire: {
      goal: 'Use top-k=50 for more diversity',
      targets: [
        {
          line: 4,
          description: 'Change the value of k',
          currentCode: 'k = 10',
          options: [
            { label: 'k = 50', newCode: 'k = 50', correct: true },
            { label: 'k = 5', newCode: 'k = 5', correct: false },
            { label: 'k = 100', newCode: 'k = 100', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 3: Architecture
  // ================================================================

  // LESSON 7: Multi-Head Attention
  {
    id: 'multi_head_attention',
    name: 'Multi-Head Attention',
    chapter: 2,
    description: 'Let each token attend to others with multiple attention heads.',
    tracer: [
      { text: 'Input: a sequence of token embeddings.', viz: 'mha_input' },
      { text: 'Multiple heads attend to different relationships.', viz: 'mha_heads' },
      { text: 'Each head computes Query, Key, Value attention.', viz: 'mha_qkv' },
      { text: 'Outputs are concatenated and projected.', viz: 'mha_output' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      '',
      'embed_dim = 64',
      'num_heads = 4',
      'seq_len = 10',
      '',
      'mha = nn.MultiheadAttention(embed_dim, num_heads)',
      'x = torch.randn(seq_len, 1, embed_dim)',
      'attn_out, attn_weights = mha(x, x, x)',
      'print(attn_out.shape)',
    ],

    xray: {
      pipeline: ['imports', 'config', 'MHA\nlayer', 'forward\nQ,K,V', 'output'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensors, nn for MultiheadAttention.',
          deepDive: 'nn.MultiheadAttention is a built-in PyTorch module that implements the multi-head attention mechanism from the "Attention Is All You Need" paper, the foundation of all transformer models.',
          deeperDive: 'The MultiheadAttention module internally creates three weight matrices (W_Q, W_K, W_V) of shape [embed_dim, embed_dim] each, plus an output projection matrix. When you create nn.MultiheadAttention(64, 4), it splits the 64-dimensional space into 4 heads of 16 dimensions each. The total parameter count is 4 * 64 * 64 = 16,384 for Q/K/V projections plus 64 * 64 = 4,096 for the output projection, totaling about 20,480 parameters.',
          options: ['Import libraries', 'Set dimensions', 'Create attention layer', 'Run forward pass'],
        },
        {
          startLine: 3,
          endLine: 5,
          color: 'XRAY_DATA',
          correctLabel: 'Set dimensions and sequence length',
          explanation: 'embed_dim=64 is the model width. num_heads=4 means 4 parallel attention computations. seq_len=10 tokens.',
          deepDive: 'Each head gets 64/4 = 16 dimensions to work with. More heads means more ways to relate tokens to each other -- one head might learn syntax, another semantics, another positional patterns.',
          deeperDive: 'embed_dim must be divisible by num_heads. Each head operates on embed_dim/num_heads = 16 dimensions independently. GPT-2 Small uses embed_dim=768 with 12 heads (64 dims per head). GPT-3 uses embed_dim=12288 with 96 heads (128 dims per head). The seq_len=10 means we have 10 token positions. The attention mechanism computes a 10x10 attention matrix showing how much each token attends to every other token.',
          options: ['Set dimensions and sequence length', 'Import libraries', 'Create attention layer', 'Run attention'],
        },
        {
          startLine: 7,
          endLine: 9,
          color: 'XRAY_MODEL',
          correctLabel: 'Create layer and run attention',
          explanation: 'Pass the same tensor as Query, Key, and Value for self-attention. Returns transformed output and attention weights.',
          deepDive: 'Self-attention means each token looks at all other tokens (including itself) to decide how to update its representation. Passing x three times means the same sequence serves as queries, keys, and values.',
          deeperDive: 'mha(x, x, x) is self-attention because the query, key, and value inputs are all the same tensor. The input shape is [seq_len, batch_size, embed_dim] = [10, 1, 64]. Internally, the module: (1) projects x to Q, K, V matrices, (2) splits into 4 heads, (3) computes attention scores as softmax(QK^T / sqrt(d_k)), (4) multiplies scores by V, (5) concatenates heads, (6) applies output projection. attn_out has the same shape as input [10, 1, 64]. attn_weights has shape [1, 10, 10] showing pairwise attention scores.',
          options: ['Create layer and run attention', 'Set dimensions', 'Import libraries', 'Print output shape'],
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
          id: 'config',
          code: 'embed_dim = 64\nnum_heads = 4\nseq_len = 10',
          lines: [3, 4, 5],
        },
        {
          id: 'attention',
          code: 'mha = nn.MultiheadAttention(embed_dim, num_heads)\nx = torch.randn(seq_len, 1, embed_dim)\nattn_out, attn_weights = mha(x, x, x)',
          lines: [7, 8, 9],
        },
      ],
    },

    rewire: {
      goal: 'Use 8 attention heads instead of 4',
      targets: [
        {
          line: 4,
          description: 'Change the number of heads',
          currentCode: 'num_heads = 4',
          options: [
            { label: 'num_heads = 8', newCode: 'num_heads = 8', correct: true },
            { label: 'num_heads = 2', newCode: 'num_heads = 2', correct: false },
            { label: 'num_heads = 16', newCode: 'num_heads = 16', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 8: Layer Norm & Residuals
  {
    id: 'layer_norm_residuals',
    name: 'Layer Norm & Residuals',
    chapter: 2,
    description: 'Stabilize training with normalization and skip connections.',
    tracer: [
      { text: 'LayerNorm normalizes each token\'s activations.', viz: 'ln_norm' },
      { text: 'It centers values around 0 with standard deviation 1.', viz: 'ln_stats' },
      { text: 'A residual connection adds the input to the output.', viz: 'ln_residual' },
      { text: 'Together they stabilize deep transformer training.', viz: 'ln_block' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      '',
      'embed_dim = 64',
      'norm = nn.LayerNorm(embed_dim)',
      'x = torch.randn(10, embed_dim)',
      '',
      'normed = norm(x)',
      'attn_out = attention_layer(normed)',
      'out = x + attn_out',
      'print(out.shape)',
    ],

    xray: {
      pipeline: ['imports', 'LayerNorm', 'normalize', 'attention', 'residual\nx + out'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensors, nn for LayerNorm.',
          deepDive: 'nn.LayerNorm is a built-in normalization layer that stabilizes the values flowing through the network. It has two learnable parameters: a scale (gamma) and a shift (beta).',
          deeperDive: 'LayerNorm was introduced as an alternative to BatchNorm for sequence models. While BatchNorm normalizes across the batch dimension (which is problematic for variable-length sequences), LayerNorm normalizes across the feature dimension independently for each sample. This makes it the standard choice for transformers. The learnable parameters gamma and beta allow the network to undo the normalization if needed, giving it the flexibility to learn the optimal scale and shift.',
          options: ['Import libraries', 'Create LayerNorm', 'Apply normalization', 'Add residual connection'],
        },
        {
          startLine: 3,
          endLine: 5,
          color: 'XRAY_DATA',
          correctLabel: 'Create LayerNorm and input',
          explanation: 'LayerNorm(64) normalizes each 64-dimensional token vector. x is a random input with 10 tokens.',
          deepDive: 'For each of the 10 tokens, LayerNorm will independently normalize its 64 values to have mean 0 and standard deviation 1. This prevents values from growing too large or too small as they pass through many layers.',
          deeperDive: 'nn.LayerNorm(64) creates a normalization layer for 64-dimensional vectors. It contains 2 * 64 = 128 learnable parameters: 64 for gamma (scale, initialized to 1) and 64 for beta (shift, initialized to 0). For input x of shape [10, 64], it computes: for each row, mean = sum(row)/64, var = sum((row-mean)^2)/64, then output = gamma * (row - mean) / sqrt(var + eps) + beta. The eps (default 1e-5) prevents division by zero. The output has the exact same shape as the input.',
          options: ['Create LayerNorm and input', 'Import libraries', 'Apply to input', 'Compute residual'],
        },
        {
          startLine: 7,
          endLine: 9,
          color: 'XRAY_TRAIN',
          correctLabel: 'Normalize, attend, and add residual',
          explanation: 'Normalize first, run attention, then add the original input back (residual connection).',
          deepDive: 'The pattern is: normalize -> transform -> add original. The addition (x + attn_out) is the residual connection. It lets gradients flow directly through the addition, preventing the vanishing gradient problem in deep networks.',
          deeperDive: 'This is the "pre-norm" transformer pattern used in GPT-2 and later models: out = x + attention(LayerNorm(x)). The residual connection (x + attn_out) creates a "highway" for gradients during backpropagation. Without it, in a 12-layer transformer, gradients would need to pass through 12 attention layers and could vanish to near-zero. With residual connections, gradients can flow directly through the additions, making deep networks trainable. The original transformer paper used "post-norm" (LayerNorm(x + attention(x))), but pre-norm is more stable for training.',
          options: ['Normalize, attend, and add residual', 'Create LayerNorm', 'Import libraries', 'Set embed dimension'],
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
          id: 'setup',
          code: 'embed_dim = 64\nnorm = nn.LayerNorm(embed_dim)\nx = torch.randn(10, embed_dim)',
          lines: [3, 4, 5],
        },
        {
          id: 'residual',
          code: 'normed = norm(x)\nattn_out = attention_layer(normed)\nout = x + attn_out',
          lines: [7, 8, 9],
        },
      ],
    },

    rewire: {
      goal: 'Use embed_dim=128 for a wider model',
      targets: [
        {
          line: 3,
          description: 'Change the embedding dimension',
          currentCode: 'embed_dim = 64',
          options: [
            { label: 'embed_dim = 128', newCode: 'embed_dim = 128', correct: true },
            { label: 'embed_dim = 32', newCode: 'embed_dim = 32', correct: false },
            { label: 'embed_dim = 64', newCode: 'embed_dim = 64', correct: false },
          ],
        },
      ],
    },
  },
];
