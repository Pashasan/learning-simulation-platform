// ============================================================
// LEVELS — 8 Lessons across 3 Chapters with X-Ray / Assemble / Rewire rounds
// ============================================================

export const LEVELS = [
  // ================================================================
  // CHAPTER 1: Embeddings
  // ================================================================

  // LESSON 1: Token IDs
  {
    id: 'token_ids',
    name: 'Token IDs',
    chapter: 0,
    description: 'Turn words into numbers the model can read.',
    tracer: [
      { text: 'Text starts as a string of characters.', viz: 'tok_text' },
      { text: 'A tokenizer splits it into sub-words.', viz: 'tok_split' },
      { text: 'Each token gets a unique integer ID.', viz: 'tok_ids' },
      { text: 'The model only sees these numbers.', viz: 'tok_tensor' },
    ],
    code: [
      'import torch',
      '',
      'vocab = {"The": 0, "cat": 1, "sat": 2}',
      'text = "The cat sat"',
      '',
      'tokens = text.split()',
      'ids = [vocab[t] for t in tokens]',
      'x = torch.tensor(ids)',
      'print(x)',
    ],

    xray: {
      pipeline: ['torch', 'vocab', 'tokenize', 'tensor'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import the library',
          explanation: 'torch provides tensors \u2014 the number containers GPT operates on.',
          deepDive: 'PyTorch is the engine behind most modern language models. Importing it gives you tensor operations, GPU support, and the building blocks for neural networks.',
          deeperDive: 'The torch package provides three core capabilities: tensors (multi-dimensional arrays that can run on GPU), autograd (automatic differentiation for training), and torch.nn (pre-built neural network layers like attention and embeddings). GPT models are built and trained entirely within PyTorch. When you run import torch, Python loads the library into memory so you can create tensors with torch.tensor(), torch.zeros(), or torch.rand().',
          options: ['Import the library', 'Define vocabulary', 'Tokenize the text', 'Create a tensor'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Define vocabulary and text',
          explanation: 'The vocabulary maps each word to a unique integer. The text is what we want to encode.',
          deepDive: 'A vocabulary is like a dictionary where every word has a page number. "The" is page 0, "cat" is page 1. The model never sees actual letters \u2014 only these numbers.',
          deeperDive: 'Real GPT models use vocabularies of 50,000+ tokens built by Byte Pair Encoding (BPE). BPE starts with individual characters and iteratively merges the most frequent pairs. So "running" might become ["run", "ning"] \u2014 two tokens. This balances vocabulary size against sequence length. Our example uses whole words for simplicity, but production tokenizers (like tiktoken for GPT-4) handle any text, including punctuation, numbers, and Unicode, by breaking it into sub-word units.',
          options: ['Define vocabulary and text', 'Import the library', 'Tokenize the text', 'Create the tensor'],
        },
        {
          startLine: 5,
          endLine: 6,
          color: 'XRAY_MODEL',
          correctLabel: 'Tokenize into integer IDs',
          explanation: 'split() breaks the string into words. The list comprehension looks up each word in the vocabulary.',
          deepDive: 'First we split the sentence into individual words. Then we look up each word in the vocabulary to get its number. "The cat sat" becomes [0, 1, 2].',
          deeperDive: 'text.split() uses whitespace as the delimiter, returning ["The", "cat", "sat"]. The list comprehension [vocab[t] for t in tokens] iterates over each token and fetches its integer ID from the dictionary. If a word is not in the vocabulary, this would raise a KeyError \u2014 real tokenizers handle unknown words by breaking them into smaller sub-word pieces that are in the vocabulary. The resulting list [0, 1, 2] is a sequence of integer indices that will be used to look up embeddings.',
          options: ['Tokenize into integer IDs', 'Define vocabulary', 'Import the library', 'Print the result'],
        },
        {
          startLine: 7,
          endLine: 8,
          color: 'XRAY_PREDICT',
          correctLabel: 'Convert to a tensor',
          explanation: 'torch.tensor wraps the Python list into a tensor \u2014 the format neural networks require.',
          deepDive: 'A tensor is like a super-powered list that can run on a GPU and track gradients. Converting our IDs to a tensor is the final step before feeding them into the model.',
          deeperDive: 'torch.tensor(ids) creates a 1D tensor of dtype torch.int64 (long integers) by default. The shape is torch.Size([3]) for our 3-token sequence. Neural networks need tensors, not Python lists, because tensors support batch operations, automatic differentiation, and GPU acceleration. In a real pipeline, you would also add a batch dimension: x = torch.tensor(ids).unsqueeze(0) gives shape [1, 3] where 1 is the batch size. Multiple sentences can be batched together by padding shorter ones to the same length.',
          options: ['Convert to a tensor', 'Tokenize the text', 'Define vocabulary', 'Import the library'],
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
          id: 'vocab',
          code: 'vocab = {"The": 0, "cat": 1, "sat": 2}\ntext = "The cat sat"',
          lines: [2, 3],
        },
        {
          id: 'tokenize',
          code: 'tokens = text.split()\nids = [vocab[t] for t in tokens]',
          lines: [5, 6],
        },
        {
          id: 'tensor',
          code: 'x = torch.tensor(ids)\nprint(x)',
          lines: [7, 8],
        },
      ],
    },

    rewire: {
      goal: 'Add a new word "down" with ID 3',
      targets: [
        {
          line: 2,
          description: 'Expand the vocabulary',
          currentCode: 'vocab = {"The": 0, "cat": 1, "sat": 2}',
          options: [
            { label: '{"The": 0, "cat": 1, "sat": 2, "down": 3}', newCode: 'vocab = {"The": 0, "cat": 1, "sat": 2, "down": 3}', correct: true },
            { label: '{"The": 0, "cat": 1, "sat": 2, "down": 2}', newCode: 'vocab = {"The": 0, "cat": 1, "sat": 2, "down": 2}', correct: false },
            { label: '{"The": 0, "cat": 1, "down": 2}', newCode: 'vocab = {"The": 0, "cat": 1, "down": 2}', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 2: Token Embeddings
  {
    id: 'token_embeddings',
    name: 'Token Embeddings',
    chapter: 0,
    description: 'Look up a learned vector for each token.',
    tracer: [
      { text: 'Each token ID points to a row in a table.', viz: 'emb_table' },
      { text: 'The table is called an embedding matrix.', viz: 'emb_matrix' },
      { text: 'Each row is a dense vector of learned numbers.', viz: 'emb_vector' },
      { text: 'Now the model has something meaningful to work with.', viz: 'emb_output' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      '',
      'vocab_size = 100',
      'd_model = 64',
      '',
      'embed = nn.Embedding(vocab_size, d_model)',
      'ids = torch.tensor([0, 1, 2])',
      'vectors = embed(ids)',
      'print(vectors.shape)',
    ],

    xray: {
      pipeline: ['imports', 'sizes', 'Embedding', 'lookup', 'shape'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensors, nn for neural network building blocks like Embedding.',
          deepDive: 'We need both imports: torch for creating tensors and nn for the Embedding layer. The nn module is where all the trainable building blocks live.',
          deeperDive: 'torch.nn.Embedding is a lookup table that stores dense vectors. It is essentially a matrix of shape [vocab_size, d_model] with trainable weights. When you pass in integer indices, it returns the corresponding rows. Under the hood, it performs the same operation as one-hot encoding followed by a matrix multiplication, but it is implemented as a direct index lookup for efficiency \u2014 no actual multiplication happens.',
          options: ['Import libraries', 'Define sizes', 'Create embedding', 'Look up vectors'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Define vocabulary and embedding sizes',
          explanation: 'vocab_size is how many unique tokens exist. d_model is the size of each vector.',
          deepDive: '100 possible tokens, each represented by a vector of 64 numbers. GPT-2 uses vocab_size=50257 and d_model=768 \u2014 much bigger, but the same idea.',
          deeperDive: 'The vocab_size determines how many rows the embedding table has \u2014 one per token in the vocabulary. The d_model (also called embedding dimension) determines how many numbers describe each token. Larger d_model means the model can represent more nuanced differences between tokens but requires more memory and computation. GPT-2 Small uses d_model=768, GPT-2 Medium uses 1024, and GPT-3 uses 12288. The total parameter count of the embedding layer alone is vocab_size * d_model.',
          options: ['Define vocabulary and embedding sizes', 'Import libraries', 'Create embedding layer', 'Look up vectors'],
        },
        {
          startLine: 6,
          endLine: 6,
          color: 'XRAY_MODEL',
          correctLabel: 'Create the embedding layer',
          explanation: 'nn.Embedding creates a lookup table with vocab_size rows and d_model columns.',
          deepDive: 'Think of it as a spreadsheet with 100 rows and 64 columns. Each row holds the vector for one token. The numbers start random and improve during training.',
          deeperDive: 'nn.Embedding(100, 64) allocates a weight matrix of shape [100, 64] initialized with random values drawn from a standard normal distribution N(0, 1). These weights are trainable parameters \u2014 during training, backpropagation adjusts each row so that semantically similar tokens end up with similar vectors. The layer has exactly vocab_size * d_model = 6,400 parameters. You can access the raw weight matrix with embed.weight, which is a tensor of shape [100, 64].',
          options: ['Create the embedding layer', 'Define sizes', 'Look up vectors', 'Import libraries'],
        },
        {
          startLine: 7,
          endLine: 9,
          color: 'XRAY_PREDICT',
          correctLabel: 'Look up embedding vectors',
          explanation: 'Passing token IDs into the embedding layer returns their vectors. Shape: [3, 64].',
          deepDive: 'Feed in [0, 1, 2] and get back 3 vectors, each with 64 numbers. The output shape is [3, 64] \u2014 3 tokens, each described by 64 learned features.',
          deeperDive: 'embed(ids) takes the integer tensor [0, 1, 2] and returns the corresponding rows from the weight matrix. This is equivalent to embed.weight[ids], a pure indexing operation. The output shape is [3, 64]: 3 tokens times 64 dimensions per token. If you add a batch dimension (ids of shape [B, T]), the output becomes [B, T, 64]. These embedding vectors are the starting representation that flows through all subsequent transformer layers. At this stage the vectors are essentially random \u2014 they only become meaningful after training.',
          options: ['Look up embedding vectors', 'Create the embedding layer', 'Define sizes', 'Import libraries'],
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
          id: 'sizes',
          code: 'vocab_size = 100\nd_model = 64',
          lines: [3, 4],
        },
        {
          id: 'embed',
          code: 'embed = nn.Embedding(vocab_size, d_model)',
          lines: [6],
        },
        {
          id: 'lookup',
          code: 'ids = torch.tensor([0, 1, 2])\nvectors = embed(ids)\nprint(vectors.shape)',
          lines: [7, 8, 9],
        },
      ],
    },

    rewire: {
      goal: 'Use d_model = 128 instead of 64',
      targets: [
        {
          line: 4,
          description: 'Change the embedding dimension',
          currentCode: 'd_model = 64',
          options: [
            { label: 'd_model = 128', newCode: 'd_model = 128', correct: true },
            { label: 'd_model = 32', newCode: 'd_model = 32', correct: false },
            { label: 'd_model = 64', newCode: 'd_model = 64', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 3: Position Embeddings
  {
    id: 'position_embeddings',
    name: 'Position Embeddings',
    chapter: 0,
    description: 'Tell the model where each token sits in the sequence.',
    tracer: [
      { text: 'Transformers process all tokens at once \u2014 no order built in.', viz: 'pos_parallel' },
      { text: 'Position embeddings encode each slot: 0, 1, 2, ...', viz: 'pos_slots' },
      { text: 'Add token embedding + position embedding.', viz: 'pos_add' },
      { text: 'Now the model knows both meaning and position.', viz: 'pos_combined' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      '',
      'max_len = 128',
      'd_model = 64',
      '',
      'tok_embed = nn.Embedding(100, d_model)',
      'pos_embed = nn.Embedding(max_len, d_model)',
      '',
      'ids = torch.tensor([0, 1, 2])',
      'positions = torch.arange(len(ids))',
      '',
      'x = tok_embed(ids) + pos_embed(positions)',
      'print(x.shape)',
    ],

    xray: {
      pipeline: ['imports', 'sizes', 'embeddings', 'add', 'output'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensors, nn for embedding layers.',
          deepDive: 'Same two imports as before. We need torch for tensor creation (torch.arange) and nn for the Embedding layers.',
          deeperDive: 'torch.arange is especially important here \u2014 it generates a sequence of integers [0, 1, 2, ..., n-1] that serve as position indices. This function is similar to Python\'s range() but returns a tensor instead of a Python iterator. We need two nn.Embedding layers: one for token identity and one for position. Both produce vectors of the same size (d_model) so they can be added together element-wise.',
          options: ['Import libraries', 'Define sizes', 'Create embeddings', 'Combine embeddings'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Define max length and dimension',
          explanation: 'max_len limits sequence length. d_model sets vector size for both embedding types.',
          deepDive: 'max_len=128 means the model can handle sequences up to 128 tokens. Both the token and position embeddings produce 64-dimensional vectors so they line up when added.',
          deeperDive: 'The max_len determines how many position slots the model supports. GPT-2 uses max_len=1024, GPT-3 uses 2048, and GPT-4 supports up to 128k tokens. If you try to feed a sequence longer than max_len, the position embedding layer will raise an index-out-of-bounds error. The d_model must be identical for token and position embeddings because they are added element-wise. The position embedding table has max_len * d_model parameters \u2014 128 * 64 = 8,192 in our case.',
          options: ['Define max length and dimension', 'Import libraries', 'Create embedding layers', 'Add embeddings together'],
        },
        {
          startLine: 6,
          endLine: 7,
          color: 'XRAY_MODEL',
          correctLabel: 'Create token and position embeddings',
          explanation: 'Two separate lookup tables: one for what the token is, one for where it sits.',
          deepDive: 'The token embedding table has 100 rows (one per word). The position embedding table has 128 rows (one per slot). Both output 64-dimensional vectors.',
          deeperDive: 'tok_embed maps token IDs to meaning vectors: "cat" always gets the same vector regardless of position. pos_embed maps position indices to location vectors: position 0 always gets the same vector regardless of which token is there. By keeping these separate and adding them, the model can learn that "cat" means the same thing everywhere (token embedding) while also knowing where it appears (position embedding). Some models use sinusoidal position encodings instead of learned embeddings, but GPT uses learned position embeddings.',
          options: ['Create token and position embeddings', 'Define sizes', 'Add embeddings', 'Import libraries'],
        },
        {
          startLine: 9,
          endLine: 12,
          color: 'XRAY_PREDICT',
          correctLabel: 'Combine token and position vectors',
          explanation: 'torch.arange creates [0, 1, 2]. Adding both embeddings gives each token its identity + position.',
          deepDive: 'torch.arange(3) gives [0, 1, 2]. The token embedding says what each word means. The position embedding says where it is. Adding them gives the model both pieces of information in one vector.',
          deeperDive: 'torch.arange(len(ids)) generates tensor([0, 1, 2]). pos_embed(positions) returns 3 position vectors of shape [3, 64]. tok_embed(ids) returns 3 token vectors of shape [3, 64]. Adding them element-wise produces x of shape [3, 64]. Each position in x now encodes both the identity of the token and its location in the sequence. This combined representation is what enters the first transformer block. The addition works because both tensors share the same shape [3, 64].',
          options: ['Combine token and position vectors', 'Create embedding layers', 'Define sizes', 'Import libraries'],
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
          id: 'sizes',
          code: 'max_len = 128\nd_model = 64',
          lines: [3, 4],
        },
        {
          id: 'embeddings',
          code: 'tok_embed = nn.Embedding(100, d_model)\npos_embed = nn.Embedding(max_len, d_model)',
          lines: [6, 7],
        },
        {
          id: 'combine',
          code: 'ids = torch.tensor([0, 1, 2])\npositions = torch.arange(len(ids))\n\nx = tok_embed(ids) + pos_embed(positions)\nprint(x.shape)',
          lines: [9, 10, 11, 12, 13],
        },
      ],
    },

    rewire: {
      goal: 'Support sequences up to 512 tokens',
      targets: [
        {
          line: 3,
          description: 'Change the max sequence length',
          currentCode: 'max_len = 128',
          options: [
            { label: 'max_len = 512', newCode: 'max_len = 512', correct: true },
            { label: 'max_len = 64', newCode: 'max_len = 64', correct: false },
            { label: 'max_len = 128', newCode: 'max_len = 128', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 2: Attention
  // ================================================================

  // LESSON 4: Query, Key, Value
  {
    id: 'qkv',
    name: 'Query, Key, Value',
    chapter: 1,
    description: 'Project each token into three roles for attention.',
    tracer: [
      { text: 'Each token gets three projections: Q, K, V.', viz: 'qkv_three' },
      { text: 'Query asks: "What am I looking for?"', viz: 'qkv_query' },
      { text: 'Key answers: "Here is what I contain."', viz: 'qkv_key' },
      { text: 'Value holds: "Here is my actual content."', viz: 'qkv_value' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      '',
      'd_model = 64',
      '',
      'W_q = nn.Linear(d_model, d_model)',
      'W_k = nn.Linear(d_model, d_model)',
      'W_v = nn.Linear(d_model, d_model)',
      '',
      'x = torch.randn(3, d_model)',
      'Q = W_q(x)',
      'K = W_k(x)',
      'V = W_v(x)',
      'print(Q.shape, K.shape, V.shape)',
    ],

    xray: {
      pipeline: ['imports', 'd_model', 'projections', 'Q K V'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensors, nn for Linear projection layers.',
          deepDive: 'We need nn.Linear to create the projection matrices that transform each token into its Query, Key, and Value representations.',
          deeperDive: 'nn.Linear(d_model, d_model) creates a matrix multiplication layer with a weight matrix W of shape [d_model, d_model] plus a bias vector b of shape [d_model]. When you call W_q(x), it computes x @ W.T + b. Three separate Linear layers mean three separate weight matrices, so Q, K, and V are three different learned projections of the same input. Some implementations fuse all three into one large Linear layer and split the output for efficiency.',
          options: ['Import libraries', 'Define dimension', 'Create projections', 'Compute Q, K, V'],
        },
        {
          startLine: 3,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Set the model dimension',
          explanation: 'd_model = 64 means each token is a 64-dimensional vector.',
          deepDive: 'The model dimension is the width of every vector flowing through the transformer. Q, K, and V all have this same size so the dot products work out correctly.',
          deeperDive: 'd_model is the hidden dimension used throughout the transformer. In GPT-2 Small, d_model=768. The projection layers are square matrices (d_model to d_model) because Q, K, V need to be the same size for the attention dot product. In multi-head attention, each head works with d_model/n_heads dimensions. For example, with d_model=64 and 4 heads, each head uses 16-dimensional Q, K, V vectors.',
          options: ['Set the model dimension', 'Import libraries', 'Create projection layers', 'Compute Q, K, V'],
        },
        {
          startLine: 5,
          endLine: 7,
          color: 'XRAY_MODEL',
          correctLabel: 'Create Q, K, V projection layers',
          explanation: 'Three separate Linear layers project the same input into three different roles.',
          deepDive: 'W_q, W_k, W_v are three separate "lenses" that look at the same token from different angles. Each one learns to extract different information during training.',
          deeperDive: 'Each nn.Linear(64, 64) has 64*64 + 64 = 4,160 parameters (weights + bias). Three layers total 12,480 parameters just for the projections. W_q learns to extract "what this token is searching for," W_k learns "what this token can be found by," and W_v learns "what information this token carries." These roles are not explicitly programmed \u2014 they emerge from training. The three projections are the core mechanism that enables self-attention.',
          options: ['Create Q, K, V projection layers', 'Set dimension', 'Import libraries', 'Compute attention scores'],
        },
        {
          startLine: 9,
          endLine: 13,
          color: 'XRAY_PREDICT',
          correctLabel: 'Compute Q, K, V vectors',
          explanation: 'Feed the token vectors through each projection. All outputs are shape [3, 64].',
          deepDive: 'The same 3 token vectors go through 3 different transformations, producing Q, K, and V matrices. Each is [3, 64]: 3 tokens, 64 dimensions.',
          deeperDive: 'x = torch.randn(3, d_model) simulates 3 tokens, each as a 64-dimensional vector (the output of the embedding layer). W_q(x) computes Q = x @ W_q.weight.T + W_q.bias, producing shape [3, 64]. Same for K and V. All three have identical shapes but different values because each Linear layer has its own trained weights. These three matrices feed into the attention mechanism: Q and K compute attention scores via dot product, and V provides the values that get mixed together based on those scores.',
          options: ['Compute Q, K, V vectors', 'Create projection layers', 'Set dimension', 'Import libraries'],
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
          id: 'dim',
          code: 'd_model = 64',
          lines: [3],
        },
        {
          id: 'projections',
          code: 'W_q = nn.Linear(d_model, d_model)\nW_k = nn.Linear(d_model, d_model)\nW_v = nn.Linear(d_model, d_model)',
          lines: [5, 6, 7],
        },
        {
          id: 'compute',
          code: 'x = torch.randn(3, d_model)\nQ = W_q(x)\nK = W_k(x)\nV = W_v(x)\nprint(Q.shape, K.shape, V.shape)',
          lines: [9, 10, 11, 12, 13],
        },
      ],
    },

    rewire: {
      goal: 'Use 5 tokens instead of 3',
      targets: [
        {
          line: 9,
          description: 'Change the number of tokens',
          currentCode: 'x = torch.randn(3, d_model)',
          options: [
            { label: 'torch.randn(5, d_model)', newCode: 'x = torch.randn(5, d_model)', correct: true },
            { label: 'torch.randn(3, 128)', newCode: 'x = torch.randn(3, 128)', correct: false },
            { label: 'torch.randn(d_model, 5)', newCode: 'x = torch.randn(d_model, 5)', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 5: Attention Scores
  {
    id: 'attention_scores',
    name: 'Attention Scores',
    chapter: 1,
    description: 'Compute how much each token attends to every other.',
    tracer: [
      { text: 'Multiply Q by K-transposed to get raw scores.', viz: 'attn_matmul' },
      { text: 'Scale by sqrt(d_k) to keep gradients stable.', viz: 'attn_scale' },
      { text: 'Softmax turns scores into probabilities.', viz: 'attn_softmax' },
      { text: 'Multiply attention weights by V to get the output.', viz: 'attn_output' },
    ],
    code: [
      'import torch',
      'import torch.nn.functional as F',
      'import math',
      '',
      'd_k = 64',
      'Q = torch.randn(3, d_k)',
      'K = torch.randn(3, d_k)',
      'V = torch.randn(3, d_k)',
      '',
      'scores = Q @ K.T / math.sqrt(d_k)',
      'weights = F.softmax(scores, dim=-1)',
      'output = weights @ V',
      'print(output.shape)',
    ],

    xray: {
      pipeline: ['imports', 'Q K V', 'scores', 'softmax', 'output'],
      regions: [
        {
          startLine: 0,
          endLine: 2,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensors, F for softmax, math for square root.',
          deepDive: 'F (torch.nn.functional) provides stateless functions like softmax. math.sqrt gives the scaling factor. These are the tools for computing attention.',
          deeperDive: 'torch.nn.functional (aliased as F) contains functions that do not have learnable parameters \u2014 softmax, relu, dropout, etc. Unlike nn.Module layers, these do not store weights. math.sqrt(d_k) is the scaling factor from the "Attention Is All You Need" paper. You could also use d_k ** 0.5 or torch.tensor(d_k).float().sqrt(), but math.sqrt is simplest for a constant value.',
          options: ['Import libraries', 'Define Q, K, V', 'Compute scores', 'Apply softmax'],
        },
        {
          startLine: 4,
          endLine: 7,
          color: 'XRAY_DATA',
          correctLabel: 'Define Q, K, V matrices',
          explanation: 'd_k is the key dimension. Q, K, V are 3 tokens, each 64-dimensional.',
          deepDive: 'In a real model, Q, K, V come from the projection layers. Here we simulate them with random values. Each matrix is [3, 64]: 3 tokens, 64 features per token.',
          deeperDive: 'The variable name d_k (dimension of keys) comes from the original transformer paper. It equals d_model in single-head attention, or d_model/n_heads in multi-head attention. The shape [3, d_k] means 3 tokens, each represented by a d_k-dimensional vector. In practice, these tensors would have a batch dimension too: [batch, seq_len, d_k]. The random initialization here is just for demonstration \u2014 in a real forward pass, Q, K, V come from the learned projection layers.',
          options: ['Define Q, K, V matrices', 'Import libraries', 'Compute attention scores', 'Get attention output'],
        },
        {
          startLine: 9,
          endLine: 9,
          color: 'XRAY_MODEL',
          correctLabel: 'Compute scaled dot-product scores',
          explanation: 'Q @ K.T gives a [3, 3] matrix. Dividing by sqrt(d_k) prevents extreme values.',
          deepDive: 'Q times K-transposed gives a 3x3 grid where each cell says how much token i cares about token j. Dividing by sqrt(64)=8 keeps numbers in a reasonable range for softmax.',
          deeperDive: 'Q @ K.T (also written as torch.matmul(Q, K.T)) produces a [3, 3] matrix where element [i, j] = dot(Q[i], K[j]). Higher dot product means Q[i] and K[j] point in similar directions, indicating relevance. Without scaling, the dot products grow proportionally to d_k (because each dot product sums d_k terms), which pushes softmax into regions with near-zero gradients. Dividing by sqrt(d_k) normalizes the variance back to ~1, ensuring healthy gradient flow. This is why the mechanism is called "scaled dot-product attention."',
          options: ['Compute scaled dot-product scores', 'Define Q, K, V', 'Apply softmax', 'Import libraries'],
        },
        {
          startLine: 10,
          endLine: 12,
          color: 'XRAY_PREDICT',
          correctLabel: 'Apply softmax and compute output',
          explanation: 'Softmax normalizes each row to sum to 1. Then weights @ V blends the value vectors.',
          deepDive: 'Softmax converts raw scores into probabilities (each row sums to 1). Then multiplying by V mixes the value vectors according to those weights \u2014 tokens that scored high contribute more.',
          deeperDive: 'F.softmax(scores, dim=-1) applies softmax along the last dimension (columns), so each row of the [3, 3] matrix sums to 1.0. Row i represents the attention distribution for token i: how much it attends to tokens 0, 1, 2. weights @ V then computes a weighted average of value vectors. If token 0 attends mostly to token 2 (weight ~0.8), the output for token 0 will be ~0.8 * V[2] + small contributions from V[0] and V[1]. The output shape is [3, d_k], same as the input \u2014 each token now carries information gathered from the tokens it attended to.',
          options: ['Apply softmax and compute output', 'Compute scores', 'Define Q, K, V', 'Import libraries'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'imports',
          code: 'import torch\nimport torch.nn.functional as F\nimport math',
          lines: [0, 1, 2],
        },
        {
          id: 'qkv',
          code: 'd_k = 64\nQ = torch.randn(3, d_k)\nK = torch.randn(3, d_k)\nV = torch.randn(3, d_k)',
          lines: [4, 5, 6, 7],
        },
        {
          id: 'scores',
          code: 'scores = Q @ K.T / math.sqrt(d_k)',
          lines: [9],
        },
        {
          id: 'output',
          code: 'weights = F.softmax(scores, dim=-1)\noutput = weights @ V\nprint(output.shape)',
          lines: [10, 11, 12],
        },
      ],
    },

    rewire: {
      goal: 'Use d_k = 128 for wider attention vectors',
      targets: [
        {
          line: 4,
          description: 'Change the key dimension',
          currentCode: 'd_k = 64',
          options: [
            { label: 'd_k = 128', newCode: 'd_k = 128', correct: true },
            { label: 'd_k = 32', newCode: 'd_k = 32', correct: false },
            { label: 'd_k = 64', newCode: 'd_k = 64', correct: false },
          ],
        },
        {
          line: 5,
          description: 'Update Q to match new d_k',
          currentCode: 'Q = torch.randn(3, d_k)',
          options: [
            { label: 'torch.randn(3, d_k)', newCode: 'Q = torch.randn(3, d_k)', correct: true },
            { label: 'torch.randn(d_k, 3)', newCode: 'Q = torch.randn(d_k, 3)', correct: false },
            { label: 'torch.randn(3, 64)', newCode: 'Q = torch.randn(3, 64)', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 6: Causal Mask
  {
    id: 'causal_mask',
    name: 'Causal Mask',
    chapter: 1,
    description: 'Prevent tokens from looking at future positions.',
    tracer: [
      { text: 'GPT predicts left to right.', viz: 'mask_direction' },
      { text: 'A triangular mask blocks future tokens.', viz: 'mask_triangle' },
      { text: 'Set masked positions to -infinity before softmax.', viz: 'mask_neginf' },
      { text: 'After softmax, masked positions become 0.', viz: 'mask_result' },
    ],
    code: [
      'import torch',
      'import torch.nn.functional as F',
      '',
      'seq_len = 4',
      'scores = torch.randn(seq_len, seq_len)',
      '',
      'mask = torch.triu(torch.ones(seq_len, seq_len),',
      '                   diagonal=1).bool()',
      'scores = scores.masked_fill(mask, float("-inf"))',
      'weights = F.softmax(scores, dim=-1)',
      'print(weights)',
    ],

    xray: {
      pipeline: ['imports', 'scores', 'mask', 'fill', 'softmax'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensors and mask creation, F for softmax.',
          deepDive: 'We need torch.triu to create the triangular mask and F.softmax to convert masked scores into probabilities.',
          deeperDive: 'torch.triu (upper triangular) is the key function here. It takes a matrix and zeros out everything below (or on) a diagonal, leaving only the upper triangle. With diagonal=1, it zeros out the diagonal itself too, leaving only the strictly upper triangle \u2014 exactly the future positions we want to block. Combined with masked_fill and softmax, this implements causal (autoregressive) masking.',
          options: ['Import libraries', 'Create scores', 'Build mask', 'Apply mask'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Create attention scores',
          explanation: 'seq_len=4 means 4 tokens. The score matrix is 4\u00D74: each token vs. every other.',
          deepDive: 'With 4 tokens, the attention score matrix is 4x4. Cell [i, j] says how much token i wants to attend to token j. We start with random scores and then mask out the forbidden ones.',
          deeperDive: 'In a real model, scores = Q @ K.T / sqrt(d_k) as we saw in the previous lesson. The shape [seq_len, seq_len] means every token has a score for every other token. For 4 tokens, that is 16 scores. The causal mask will zero out 6 of them (the upper triangle), leaving 10 valid attention connections. This quadratic scaling (seq_len^2) is why long sequences are expensive \u2014 GPT-4\'s 128k context means ~16 billion attention scores per layer per head.',
          options: ['Create attention scores', 'Import libraries', 'Build the mask', 'Apply mask and softmax'],
        },
        {
          startLine: 6,
          endLine: 7,
          color: 'XRAY_MODEL',
          correctLabel: 'Build the causal mask',
          explanation: 'torch.triu with diagonal=1 creates an upper-triangle mask marking future positions as True.',
          deepDive: 'triu makes a triangle of ones above the main diagonal. Converting to bool gives True where future tokens are \u2014 these are the positions we want to block.',
          deeperDive: 'torch.ones(4, 4) creates a 4x4 matrix of all ones. torch.triu(..., diagonal=1) keeps only the values above the main diagonal and zeros the rest. The result looks like [[0,1,1,1],[0,0,1,1],[0,0,0,1],[0,0,0,0]]. Calling .bool() converts to True/False. True means "this is a future token \u2014 block it." Token 0 can only see itself. Token 1 can see tokens 0 and 1. Token 3 can see all 4 tokens. This ensures autoregressive generation: each prediction only uses past context.',
          options: ['Build the causal mask', 'Create scores', 'Apply mask', 'Import libraries'],
        },
        {
          startLine: 8,
          endLine: 10,
          color: 'XRAY_PREDICT',
          correctLabel: 'Apply mask and normalize',
          explanation: 'masked_fill sets future positions to -inf. After softmax, -inf becomes 0 probability.',
          deepDive: 'Setting blocked positions to -infinity is clever: softmax([-inf]) = 0, so those tokens contribute nothing. The remaining valid positions still sum to 1 after softmax.',
          deeperDive: 'masked_fill(mask, float("-inf")) replaces every True position in the score matrix with negative infinity. When softmax processes a row like [0.5, -inf, -inf, -inf], it computes exp(0.5) / (exp(0.5) + exp(-inf) + exp(-inf) + exp(-inf)) = exp(0.5) / exp(0.5) = 1.0. So the single visible token gets all the attention weight. For a row like [0.3, 0.7, -inf, -inf], softmax distributes weight between the two visible tokens proportionally: roughly [0.4, 0.6, 0, 0]. This is more numerically stable than multiplying by a 0/1 mask after softmax.',
          options: ['Apply mask and normalize', 'Build the mask', 'Create scores', 'Import libraries'],
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
          id: 'scores',
          code: 'seq_len = 4\nscores = torch.randn(seq_len, seq_len)',
          lines: [3, 4],
        },
        {
          id: 'mask',
          code: 'mask = torch.triu(torch.ones(seq_len, seq_len),\n                   diagonal=1).bool()',
          lines: [6, 7],
        },
        {
          id: 'apply',
          code: 'scores = scores.masked_fill(mask, float("-inf"))\nweights = F.softmax(scores, dim=-1)\nprint(weights)',
          lines: [8, 9, 10],
        },
      ],
    },

    rewire: {
      goal: 'Use a sequence length of 8 instead of 4',
      targets: [
        {
          line: 3,
          description: 'Change the sequence length',
          currentCode: 'seq_len = 4',
          options: [
            { label: 'seq_len = 8', newCode: 'seq_len = 8', correct: true },
            { label: 'seq_len = 2', newCode: 'seq_len = 2', correct: false },
            { label: 'seq_len = 4', newCode: 'seq_len = 4', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 3: Output
  // ================================================================

  // LESSON 7: Feed-Forward Network
  {
    id: 'feed_forward',
    name: 'Feed-Forward Network',
    chapter: 2,
    description: 'Process each token independently through a two-layer MLP.',
    tracer: [
      { text: 'After attention, each token is processed independently.', viz: 'ffn_independent' },
      { text: 'Expand to a wider hidden layer (4x).', viz: 'ffn_expand' },
      { text: 'GELU activation adds non-linearity.', viz: 'ffn_gelu' },
      { text: 'Project back to the original dimension.', viz: 'ffn_project' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      '',
      'd_model = 64',
      'd_ff = 256',
      '',
      'ffn = nn.Sequential(',
      '    nn.Linear(d_model, d_ff),',
      '    nn.GELU(),',
      '    nn.Linear(d_ff, d_model)',
      ')',
      '',
      'x = torch.randn(3, d_model)',
      'out = ffn(x)',
      'print(out.shape)',
    ],

    xray: {
      pipeline: ['imports', 'sizes', 'FFN', 'forward'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensors, nn for Sequential and Linear layers.',
          deepDive: 'Same imports as before. The FFN is built from standard nn.Linear layers and a GELU activation, all available in the nn module.',
          deeperDive: 'The feed-forward network (FFN) is the other major component of a transformer block, alongside attention. While attention mixes information across tokens, the FFN processes each token independently through the same neural network. Every transformer block has one attention layer followed by one FFN. The FFN acts as a per-token feature transformation, allowing the model to compute complex functions of the attended information.',
          options: ['Import libraries', 'Define dimensions', 'Build the FFN', 'Run forward pass'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Define model and FFN dimensions',
          explanation: 'd_model=64 is the token dimension. d_ff=256 is the hidden layer (4x wider).',
          deepDive: 'The FFN temporarily expands each token to a wider representation (64 to 256), processes it, then squeezes back down. The 4x expansion is standard in transformers.',
          deeperDive: 'The 4x expansion ratio (d_ff = 4 * d_model) is a convention from the original "Attention Is All You Need" paper. GPT-2 uses d_model=768 and d_ff=3072 (exactly 4x). This expansion gives the network more room to compute complex features. The FFN has d_model * d_ff + d_ff + d_ff * d_model + d_model parameters. For our example: 64*256 + 256 + 256*64 + 64 = 33,088 parameters. In GPT-2, each FFN has ~4.7 million parameters.',
          options: ['Define model and FFN dimensions', 'Import libraries', 'Build the FFN', 'Run forward pass'],
        },
        {
          startLine: 6,
          endLine: 10,
          color: 'XRAY_MODEL',
          correctLabel: 'Build the feed-forward network',
          explanation: 'Linear expands 64\u2192256, GELU activates, Linear compresses 256\u219264.',
          deepDive: 'The FFN has three steps: expand (make wider), activate (add non-linearity with GELU), and compress (back to original size). It processes each token the same way, independently.',
          deeperDive: 'nn.Sequential chains the layers: input [3, 64] \u2192 Linear(64, 256) \u2192 [3, 256] \u2192 GELU() \u2192 [3, 256] \u2192 Linear(256, 64) \u2192 [3, 64]. GELU (Gaussian Error Linear Unit) is like a smooth version of ReLU: it approximately zeros out negative values but with a smooth curve instead of a hard cutoff. GPT-2 and GPT-3 both use GELU. The original transformer used ReLU, but GELU tends to train slightly better for language models. The FFN is applied identically to each token \u2014 the same weights process token 0, token 1, and token 2.',
          options: ['Build the feed-forward network', 'Define dimensions', 'Import libraries', 'Run forward pass'],
        },
        {
          startLine: 12,
          endLine: 14,
          color: 'XRAY_PREDICT',
          correctLabel: 'Run the forward pass',
          explanation: 'Feed 3 tokens through the FFN. Output shape is [3, 64] \u2014 same as input.',
          deepDive: 'Each of the 3 tokens goes through the expand-activate-compress pipeline independently. The output is [3, 64], same shape as the input, ready for the next layer.',
          deeperDive: 'ffn(x) passes x through all three layers in sequence. The output shape [3, 64] matches the input shape \u2014 this is by design, since transformer blocks must preserve the token dimension so they can be stacked. In a full transformer, the FFN output is added to the input via a residual connection: x = x + ffn(layer_norm(x)). This skip connection helps gradients flow through deep networks (GPT-2 has 12 blocks, GPT-3 has 96). The FFN is sometimes called the "MLP" (multi-layer perceptron) block.',
          options: ['Run the forward pass', 'Build the FFN', 'Define dimensions', 'Import libraries'],
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
          id: 'sizes',
          code: 'd_model = 64\nd_ff = 256',
          lines: [3, 4],
        },
        {
          id: 'ffn',
          code: 'ffn = nn.Sequential(\n    nn.Linear(d_model, d_ff),\n    nn.GELU(),\n    nn.Linear(d_ff, d_model)\n)',
          lines: [6, 7, 8, 9, 10],
        },
        {
          id: 'forward',
          code: 'x = torch.randn(3, d_model)\nout = ffn(x)\nprint(out.shape)',
          lines: [12, 13, 14],
        },
      ],
    },

    rewire: {
      goal: 'Use ReLU instead of GELU',
      targets: [
        {
          line: 8,
          description: 'Change the activation function',
          currentCode: '    nn.GELU(),',
          options: [
            { label: 'nn.ReLU()', newCode: '    nn.ReLU(),', correct: true },
            { label: 'nn.Sigmoid()', newCode: '    nn.Sigmoid(),', correct: false },
            { label: 'nn.GELU()', newCode: '    nn.GELU(),', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 8: Next-Token Prediction
  {
    id: 'next_token_prediction',
    name: 'Next-Token Prediction',
    chapter: 2,
    description: 'Map the final hidden state to vocabulary logits and sample.',
    tracer: [
      { text: 'The last token\'s hidden state carries all context.', viz: 'ntp_last' },
      { text: 'A linear layer maps it to vocabulary scores.', viz: 'ntp_logits' },
      { text: 'Softmax converts scores to probabilities.', viz: 'ntp_probs' },
      { text: 'Sample or argmax to pick the next token.', viz: 'ntp_sample' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      'import torch.nn.functional as F',
      '',
      'vocab_size = 100',
      'd_model = 64',
      '',
      'lm_head = nn.Linear(d_model, vocab_size)',
      'hidden = torch.randn(3, d_model)',
      '',
      'logits = lm_head(hidden)',
      'last_logits = logits[-1]',
      'probs = F.softmax(last_logits, dim=-1)',
      'next_token = torch.argmax(probs)',
      'print(next_token)',
    ],

    xray: {
      pipeline: ['imports', 'sizes', 'lm_head', 'logits', 'sample'],
      regions: [
        {
          startLine: 0,
          endLine: 2,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch, nn for the output layer, F for softmax.',
          deepDive: 'We need nn.Linear for the language model head (the final projection), and F.softmax to convert logits into probabilities for sampling.',
          deeperDive: 'The language model head (lm_head) is the very last layer of GPT. It maps from the model\'s internal dimension (d_model) to the full vocabulary size. This is sometimes called the "unembedding" layer because it reverses the embedding: embeddings go from token IDs to vectors, and lm_head goes from vectors back to token probabilities. In some models, the lm_head actually shares weights with the embedding layer (weight tying).',
          options: ['Import libraries', 'Define sizes', 'Create language model head', 'Compute next token'],
        },
        {
          startLine: 4,
          endLine: 5,
          color: 'XRAY_DATA',
          correctLabel: 'Define vocabulary and model sizes',
          explanation: 'vocab_size=100 tokens in the vocabulary. d_model=64 is the hidden dimension.',
          deepDive: 'The output layer needs to produce one score per possible token. With 100 tokens in the vocabulary, it outputs 100 numbers \u2014 one score per candidate next word.',
          deeperDive: 'In GPT-2, vocab_size=50257 and d_model=768, so the lm_head is a matrix of shape [768, 50257] with ~38.6 million parameters. This single layer accounts for a significant fraction of the model\'s total parameter count. The output of lm_head is called "logits" \u2014 raw unnormalized scores. A higher logit for token i means the model thinks token i is more likely to come next.',
          options: ['Define vocabulary and model sizes', 'Import libraries', 'Create output layer', 'Generate prediction'],
        },
        {
          startLine: 7,
          endLine: 8,
          color: 'XRAY_MODEL',
          correctLabel: 'Create language model head and hidden states',
          explanation: 'lm_head maps d_model\u2192vocab_size. hidden simulates the transformer output for 3 tokens.',
          deepDive: 'The lm_head is a single Linear layer that converts each 64-dimensional hidden state into 100 vocabulary scores. The hidden tensor simulates what the transformer blocks would output.',
          deeperDive: 'nn.Linear(d_model, vocab_size) creates a weight matrix W of shape [vocab_size, d_model] = [100, 64] plus a bias vector of size 100. For each token position, lm_head(hidden[i]) computes logits[i] = hidden[i] @ W.T + bias, producing 100 scores. hidden = torch.randn(3, d_model) simulates the output of the final transformer block for a 3-token sequence. In a real model, this would be the result of passing embeddings through 12+ attention + FFN blocks.',
          options: ['Create language model head and hidden states', 'Define sizes', 'Import libraries', 'Compute probabilities'],
        },
        {
          startLine: 10,
          endLine: 14,
          color: 'XRAY_PREDICT',
          correctLabel: 'Predict the next token',
          explanation: 'Get logits for all positions. Use the last token\'s logits, apply softmax, pick argmax.',
          deepDive: 'logits[-1] grabs the last token\'s scores because GPT predicts left-to-right: the last position holds the prediction for what comes next. Softmax + argmax picks the most likely token.',
          deeperDive: 'lm_head(hidden) maps [3, 64] to [3, 100], giving vocabulary scores for each of the 3 positions. logits[-1] selects the last row \u2014 shape [100] \u2014 because in autoregressive generation, position i predicts token i+1. The last position has seen all previous tokens and predicts the next one. F.softmax converts logits to probabilities that sum to 1. torch.argmax picks the index with the highest probability (greedy decoding). Alternatively, you could sample with torch.multinomial(probs, 1) for more diverse outputs, or use top-k/top-p sampling for a balance between quality and diversity.',
          options: ['Predict the next token', 'Create output layer', 'Define sizes', 'Import libraries'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'imports',
          code: 'import torch\nimport torch.nn as nn\nimport torch.nn.functional as F',
          lines: [0, 1, 2],
        },
        {
          id: 'sizes',
          code: 'vocab_size = 100\nd_model = 64',
          lines: [4, 5],
        },
        {
          id: 'head',
          code: 'lm_head = nn.Linear(d_model, vocab_size)\nhidden = torch.randn(3, d_model)',
          lines: [7, 8],
        },
        {
          id: 'predict',
          code: 'logits = lm_head(hidden)\nlast_logits = logits[-1]\nprobs = F.softmax(last_logits, dim=-1)\nnext_token = torch.argmax(probs)\nprint(next_token)',
          lines: [10, 11, 12, 13, 14],
        },
      ],
    },

    rewire: {
      goal: 'Use a vocabulary of 50257 tokens (GPT-2 size)',
      targets: [
        {
          line: 4,
          description: 'Change the vocabulary size',
          currentCode: 'vocab_size = 100',
          options: [
            { label: 'vocab_size = 50257', newCode: 'vocab_size = 50257', correct: true },
            { label: 'vocab_size = 256', newCode: 'vocab_size = 256', correct: false },
            { label: 'vocab_size = 100', newCode: 'vocab_size = 100', correct: false },
          ],
        },
      ],
    },
  },
];
