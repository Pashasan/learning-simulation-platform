// ============================================================
// LEVELS — 8 NLP Lessons across 3 Chapters with X-Ray / Assemble / Rewire rounds
// ============================================================

export const LEVELS = [
  // ================================================================
  // CHAPTER 1: Text as Data
  // ================================================================

  // LESSON 1: Tokenizing Text
  {
    id: 'tokenizing_text',
    name: 'Tokenizing Text',
    chapter: 0,
    description: 'Split sentences into tokens and map them to numbers.',
    tracer: [
      { text: 'A sentence is a sequence of words.', viz: 'tok_sentence' },
      { text: 'Each word gets a number from the vocabulary.', viz: 'tok_vocab' },
      { text: 'The sentence becomes a list of integers.', viz: 'tok_indices' },
      { text: 'Convert to a tensor for PyTorch.', viz: 'tok_tensor' },
    ],
    code: [
      'import torch',
      '',
      'vocab = {"the": 0, "cat": 1, "sat": 2,',
      '         "on": 3, "mat": 4}',
      '',
      'sentence = "the cat sat on the mat"',
      'tokens = sentence.split()',
      'indices = [vocab[w] for w in tokens]',
      '',
      'tensor = torch.tensor(indices)',
      'print(tensor)',
    ],

    xray: {
      pipeline: ['torch', 'vocab', 'tokenize', 'tensor'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import the library',
          explanation: 'torch is PyTorch — the toolkit for tensors and neural networks.',
          deepDive: 'PyTorch is a toolkit for building and training neural networks. Importing it is like opening a toolbox before you start a project.',
          deeperDive: 'The torch package gives you tensors (multi-dimensional arrays), autograd (automatic differentiation), and torch.nn (pre-built neural network layers). For NLP, you will use tensors to store sequences of word indices, and nn modules to build models that process text. The import makes all of these available.',
          options: ['Import the library', 'Define vocabulary', 'Tokenize text', 'Create tensor'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Define the vocabulary',
          explanation: 'A vocabulary maps each word to a unique integer. This is how text becomes numbers.',
          deepDive: 'A vocabulary is like a phone book for words — each word gets its own unique number. The model never sees the actual words, only these numbers.',
          deeperDive: 'In real NLP systems, vocabularies are built automatically by scanning the training corpus and assigning an integer to each unique word. Common sizes range from 10,000 to 50,000 words. Words not in the vocabulary are mapped to a special <UNK> (unknown) token. The order of assignment does not matter — what matters is that each word always maps to the same integer. Libraries like torchtext and HuggingFace tokenizers handle vocabulary creation automatically.',
          options: ['Define the vocabulary', 'Import the library', 'Split the sentence', 'Create a tensor'],
        },
        {
          startLine: 5,
          endLine: 7,
          color: 'XRAY_MODEL',
          correctLabel: 'Tokenize the sentence',
          explanation: 'split() breaks the sentence into words. The list comprehension converts each word to its index.',
          deepDive: 'First split the sentence into individual words, then look up each word in the vocabulary dictionary to get its number. "the cat sat" becomes [0, 1, 2].',
          deeperDive: 'split() with no arguments splits on whitespace and handles multiple spaces gracefully. The list comprehension [vocab[w] for w in tokens] iterates over each token and looks it up in the dictionary. If a word is not in vocab, this raises a KeyError — in production you would use vocab.get(w, unk_id) to handle unknown words. More sophisticated tokenizers like BPE (Byte Pair Encoding) split rare words into subword pieces, so "unhappiness" might become ["un", "happiness"] or even ["un", "happ", "iness"].',
          options: ['Tokenize the sentence', 'Define the vocabulary', 'Import the library', 'Print output'],
        },
        {
          startLine: 9,
          endLine: 10,
          color: 'XRAY_PREDICT',
          correctLabel: 'Convert to a tensor',
          explanation: 'torch.tensor() wraps the list of integers into a PyTorch tensor for model input.',
          deepDive: 'A Python list of numbers becomes a PyTorch tensor — the format neural networks expect. The tensor holds [0, 1, 2, 3, 0, 4] representing our sentence.',
          deeperDive: 'torch.tensor(indices) creates a 1D LongTensor by default when given a list of integers. The dtype will be torch.int64 (long), which is exactly what embedding layers expect as input. If you passed floats instead, it would create a FloatTensor (torch.float32). The shape here is torch.Size([6]) — one dimension with 6 elements, one per word in our sentence. Batching multiple sentences together requires padding them to equal length first.',
          options: ['Convert to a tensor', 'Tokenize the sentence', 'Define the vocabulary', 'Import the library'],
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
          code: 'vocab = {"the": 0, "cat": 1, "sat": 2,\n         "on": 3, "mat": 4}',
          lines: [2, 3],
        },
        {
          id: 'tokenize',
          code: 'sentence = "the cat sat on the mat"\ntokens = sentence.split()\nindices = [vocab[w] for w in tokens]',
          lines: [5, 6, 7],
        },
        {
          id: 'tensor',
          code: 'tensor = torch.tensor(indices)\nprint(tensor)',
          lines: [9, 10],
        },
      ],
    },

    rewire: {
      goal: 'Add "dog" to the vocabulary with index 5',
      targets: [
        {
          line: 3,
          description: 'Add a new word to vocab',
          currentCode: '         "on": 3, "mat": 4}',
          options: [
            { label: '"on": 3, "mat": 4, "dog": 5}', newCode: '         "on": 3, "mat": 4, "dog": 5}', correct: true },
            { label: '"on": 3, "mat": 4, "dog": 4}', newCode: '         "on": 3, "mat": 4, "dog": 4}', correct: false },
            { label: '"on": 3, "dog": 4}', newCode: '         "on": 3, "dog": 4}', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 2: Embeddings
  {
    id: 'embeddings',
    name: 'Embeddings',
    chapter: 0,
    description: 'Turn word indices into dense vector representations.',
    tracer: [
      { text: 'Each word index is just a number — not useful yet.', viz: 'emb_indices' },
      { text: 'An embedding table maps each index to a vector.', viz: 'emb_table' },
      { text: 'Similar words end up with similar vectors.', viz: 'emb_similar' },
      { text: 'The model learns these vectors during training.', viz: 'emb_learned' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      '',
      'embedding = nn.Embedding(',
      '    num_embeddings=1000,',
      '    embedding_dim=64',
      ')',
      '',
      'indices = torch.tensor([4, 12, 7])',
      'vectors = embedding(indices)',
      'print(vectors.shape)',
    ],

    xray: {
      pipeline: ['imports', 'Embedding\n1000×64', 'lookup', 'output'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensors, nn for the Embedding layer.',
          deepDive: 'We need torch to create tensors of word indices and nn to build the embedding lookup table. Both are essential for NLP models.',
          deeperDive: 'torch.nn.Embedding is the dedicated layer for turning integer indices into dense vectors. It is more efficient than manually indexing a weight matrix because it avoids creating a full one-hot vector. Internally, it is just a matrix of shape (num_embeddings, embedding_dim) and the forward pass is simply a row lookup — no matrix multiplication needed.',
          options: ['Import libraries', 'Create embedding layer', 'Look up vectors', 'Print shapes'],
        },
        {
          startLine: 3,
          endLine: 6,
          color: 'XRAY_DATA',
          correctLabel: 'Create embedding layer',
          explanation: 'A table of 1000 words, each represented by a 64-dimensional vector.',
          deepDive: 'Think of it as a table with 1000 rows (one per word) and 64 columns (the vector dimensions). Looking up word 12 returns row 12 — a list of 64 numbers.',
          deeperDive: 'nn.Embedding(1000, 64) creates a weight matrix of shape [1000, 64] initialized with random values from a standard normal distribution. The 1000 is your vocabulary size — it must be at least as large as the highest index you will look up. The 64 is the embedding dimension — a hyperparameter you choose. Common values are 50, 100, 128, 256, or 300. Larger dimensions capture more nuance but require more data to train. The total parameter count is 1000 × 64 = 64,000 trainable weights.',
          options: ['Create embedding layer', 'Import libraries', 'Look up word vectors', 'Print output shape'],
        },
        {
          startLine: 8,
          endLine: 9,
          color: 'XRAY_MODEL',
          correctLabel: 'Look up word vectors',
          explanation: 'Pass word indices in, get dense vectors out. Each index becomes a 64-dim vector.',
          deepDive: 'Feeding [4, 12, 7] into the embedding returns three vectors — like looking up three words in a dictionary and getting their definitions.',
          deeperDive: 'embedding(indices) does a simple table lookup: for each integer in the input tensor, it returns the corresponding row from the weight matrix. Input shape [3] (three word indices) becomes output shape [3, 64] (three vectors, each with 64 dimensions). During training, backpropagation adjusts only the rows that were looked up in each batch, making it efficient for large vocabularies. This is mathematically equivalent to multiplying a one-hot vector by the weight matrix, but much faster.',
          options: ['Look up word vectors', 'Create embedding layer', 'Import libraries', 'Define vocabulary'],
        },
        {
          startLine: 10,
          endLine: 10,
          color: 'XRAY_PREDICT',
          correctLabel: 'Check output shape',
          explanation: 'vectors.shape is [3, 64] — three words, each a 64-dimensional vector.',
          deepDive: 'The shape confirms: 3 words in, 3 vectors out. Each vector has 64 numbers. This is the representation the rest of the network will work with.',
          deeperDive: 'torch.Size([3, 64]) means a 2D tensor with 3 rows and 64 columns. If you had a batch of sentences, you would pass a 2D tensor of shape [batch_size, seq_len] and get back a 3D tensor of shape [batch_size, seq_len, 64]. The embedding layer handles batches automatically — it simply looks up each integer independently. You can inspect individual word vectors with vectors[0] to see the 64-dim representation of word index 4.',
          options: ['Check output shape', 'Look up word vectors', 'Create embedding layer', 'Import libraries'],
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
          id: 'embedding',
          code: 'embedding = nn.Embedding(\n    num_embeddings=1000,\n    embedding_dim=64\n)',
          lines: [3, 4, 5, 6],
        },
        {
          id: 'lookup',
          code: 'indices = torch.tensor([4, 12, 7])\nvectors = embedding(indices)',
          lines: [8, 9],
        },
        {
          id: 'print',
          code: 'print(vectors.shape)',
          lines: [10],
        },
      ],
    },

    rewire: {
      goal: 'Use 128-dimensional embeddings instead of 64',
      targets: [
        {
          line: 5,
          description: 'Change embedding dimension',
          currentCode: '    embedding_dim=64',
          options: [
            { label: 'embedding_dim=128', newCode: '    embedding_dim=128', correct: true },
            { label: 'embedding_dim=32', newCode: '    embedding_dim=32', correct: false },
            { label: 'num_embeddings=128', newCode: '    num_embeddings=128', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 3: Padding Sequences
  {
    id: 'padding_sequences',
    name: 'Padding Sequences',
    chapter: 0,
    description: 'Make sentences the same length for batching.',
    tracer: [
      { text: 'Sentences have different lengths.', viz: 'pad_different' },
      { text: 'Shorter sentences get padded with zeros.', viz: 'pad_zeros' },
      { text: 'Now all sentences have the same length.', viz: 'pad_equal' },
    ],
    code: [
      'import torch',
      'from torch.nn.utils.rnn import pad_sequence',
      '',
      'seq1 = torch.tensor([4, 12, 7, 3])',
      'seq2 = torch.tensor([1, 5])',
      'seq3 = torch.tensor([8, 2, 6])',
      '',
      'batch = pad_sequence(',
      '    [seq1, seq2, seq3],',
      '    batch_first=True,',
      '    padding_value=0',
      ')',
      'print(batch.shape)',
      'print(batch)',
    ],

    xray: {
      pipeline: ['imports', 'sequences', 'pad_sequence', 'batch'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensors, pad_sequence for padding variable-length sequences.',
          deepDive: 'pad_sequence is a helper function that takes a list of tensors with different lengths and pads them to match the longest one.',
          deeperDive: 'pad_sequence lives in torch.nn.utils.rnn because it was originally designed for RNN inputs, but it works for any variable-length sequence data. It pads all sequences to match the length of the longest sequence in the list. The alternative is manual padding with torch.zeros or torch.full, but pad_sequence handles the sizing automatically and is less error-prone.',
          options: ['Import libraries', 'Create sequences', 'Pad sequences', 'Print results'],
        },
        {
          startLine: 3,
          endLine: 5,
          color: 'XRAY_DATA',
          correctLabel: 'Create variable-length sequences',
          explanation: 'Three sentences of different lengths: 4, 2, and 3 tokens.',
          deepDive: 'In real NLP, sentences rarely have the same length. "I like dogs" has 3 words but "The cat sat on the mat" has 6. We need to handle this mismatch.',
          deeperDive: 'Each tensor represents a tokenized sentence where integers are word indices from a vocabulary. seq1 has 4 tokens, seq2 has 2, and seq3 has 3. Neural networks need fixed-size inputs for batch processing — you cannot stack tensors of different lengths into a single matrix. This is why padding is necessary: it makes all sequences the same length so they can be processed together efficiently on a GPU.',
          options: ['Create variable-length sequences', 'Import libraries', 'Pad the sequences', 'Print the batch'],
        },
        {
          startLine: 7,
          endLine: 11,
          color: 'XRAY_MODEL',
          correctLabel: 'Pad sequences into a batch',
          explanation: 'pad_sequence adds zeros to shorter sequences. batch_first=True puts batch dimension first.',
          deepDive: 'Like adding blank cells to a spreadsheet so every row is the same width. The zeros tell the model "there is no word here" — the model learns to ignore them.',
          deeperDive: 'batch_first=True gives output shape [batch_size, max_seq_len], so [3, 4] here. Without batch_first, the shape would be [max_seq_len, batch_size] = [4, 3], which is the default because some RNN implementations prefer time-first format. padding_value=0 fills the gaps with zeros, which typically corresponds to a <PAD> token in the vocabulary. In practice, you also create a mask tensor (batch != 0) to tell attention layers and loss functions which positions are real tokens versus padding.',
          options: ['Pad sequences into a batch', 'Create variable-length sequences', 'Import libraries', 'Print the batch'],
        },
        {
          startLine: 12,
          endLine: 13,
          color: 'XRAY_PREDICT',
          correctLabel: 'Check the result',
          explanation: 'Shape is [3, 4] — 3 sentences, padded to length 4. Shorter ones filled with 0.',
          deepDive: 'The batch is now a neat 3-by-4 matrix. Each row is a sentence, padded to length 4 (the longest). The zeros on the right are padding.',
          deeperDive: 'The output is: [[4, 12, 7, 3], [1, 5, 0, 0], [8, 2, 6, 0]]. seq2 got two zeros appended and seq3 got one zero. The shape [3, 4] means 3 sequences of length 4. This batch can now be fed directly to an embedding layer, which will produce shape [3, 4, embedding_dim]. The pad tokens will also get embedded, but their embeddings are typically ignored downstream using attention masks or by convention (padding index 0 can be frozen to zero vectors).',
          options: ['Check the result', 'Pad sequences into a batch', 'Create sequences', 'Import libraries'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'imports',
          code: 'import torch\nfrom torch.nn.utils.rnn import pad_sequence',
          lines: [0, 1],
        },
        {
          id: 'sequences',
          code: 'seq1 = torch.tensor([4, 12, 7, 3])\nseq2 = torch.tensor([1, 5])\nseq3 = torch.tensor([8, 2, 6])',
          lines: [3, 4, 5],
        },
        {
          id: 'pad',
          code: 'batch = pad_sequence(\n    [seq1, seq2, seq3],\n    batch_first=True,\n    padding_value=0\n)',
          lines: [7, 8, 9, 10, 11],
        },
        {
          id: 'print',
          code: 'print(batch.shape)\nprint(batch)',
          lines: [12, 13],
        },
      ],
    },

    rewire: {
      goal: 'Use -1 as the padding value instead of 0',
      targets: [
        {
          line: 10,
          description: 'Change the padding value',
          currentCode: '    padding_value=0',
          options: [
            { label: 'padding_value=-1', newCode: '    padding_value=-1', correct: true },
            { label: 'padding_value=1', newCode: '    padding_value=1', correct: false },
            { label: 'batch_first=False', newCode: '    batch_first=False', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 2: Sequence Models
  // ================================================================

  // LESSON 4: RNN Forward Pass
  {
    id: 'rnn_forward_pass',
    name: 'RNN Forward Pass',
    chapter: 1,
    description: 'Feed a sequence through a recurrent neural network.',
    tracer: [
      { text: 'An RNN processes one token at a time.', viz: 'rnn_step' },
      { text: 'At each step, it updates a hidden state.', viz: 'rnn_hidden' },
      { text: 'The hidden state carries context forward.', viz: 'rnn_context' },
      { text: 'The final hidden state summarizes the whole sequence.', viz: 'rnn_final' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      '',
      'rnn = nn.RNN(',
      '    input_size=64,',
      '    hidden_size=128,',
      '    batch_first=True',
      ')',
      '',
      'x = torch.randn(1, 5, 64)',
      'output, hidden = rnn(x)',
      'print(output.shape)',
      'print(hidden.shape)',
    ],

    xray: {
      pipeline: ['imports', 'RNN\n64→128', 'input', 'forward'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensors, nn for the RNN layer.',
          deepDive: 'We need torch to create input tensors and nn to build the recurrent layer. RNNs are a fundamental building block for processing sequences.',
          deeperDive: 'nn.RNN is the simplest recurrent layer in PyTorch. More advanced variants include nn.LSTM (Long Short-Term Memory) and nn.GRU (Gated Recurrent Unit), which handle long sequences better by solving the vanishing gradient problem. All three share the same API: you pass in a sequence tensor and get back outputs and hidden states.',
          options: ['Import libraries', 'Create RNN', 'Prepare input', 'Run forward pass'],
        },
        {
          startLine: 3,
          endLine: 7,
          color: 'XRAY_DATA',
          correctLabel: 'Create the RNN layer',
          explanation: 'input_size=64 (embedding dim), hidden_size=128 (memory capacity). batch_first=True for convenience.',
          deepDive: 'The RNN takes 64-dimensional vectors in (one per word) and maintains a 128-dimensional hidden state that evolves as it reads through the sequence.',
          deeperDive: 'input_size=64 must match the embedding dimension of your word vectors. hidden_size=128 determines the capacity of the RNN\'s memory — larger values can capture more complex patterns but require more computation. batch_first=True means input shape is [batch, seq_len, features] instead of the default [seq_len, batch, features]. The RNN applies the same transformation at every time step: h_t = tanh(W_ih * x_t + W_hh * h_{t-1} + b). This weight sharing is what makes RNNs parameter-efficient for sequences of any length.',
          options: ['Create the RNN layer', 'Import libraries', 'Prepare input data', 'Run forward pass'],
        },
        {
          startLine: 9,
          endLine: 9,
          color: 'XRAY_MODEL',
          correctLabel: 'Prepare input data',
          explanation: 'Shape [1, 5, 64]: 1 sentence, 5 words, each a 64-dim vector.',
          deepDive: 'This is a single sentence of 5 words, where each word is represented as a 64-dimensional vector (like from an embedding layer).',
          deeperDive: 'torch.randn(1, 5, 64) creates random data standing in for embedded word vectors. In a real pipeline, this would come from an nn.Embedding layer. The dimensions are: batch_size=1 (one sentence), seq_len=5 (five words), input_size=64 (embedding dimension). For multiple sentences, you would increase the first dimension, for example shape [32, 5, 64] for a batch of 32 sentences.',
          options: ['Prepare input data', 'Create the RNN layer', 'Import libraries', 'Print output shapes'],
        },
        {
          startLine: 10,
          endLine: 12,
          color: 'XRAY_PREDICT',
          correctLabel: 'Run forward pass and check shapes',
          explanation: 'output has shape [1, 5, 128] — hidden state at every step. hidden is [1, 1, 128] — the final state.',
          deepDive: 'The RNN returns two things: output (the hidden state at every time step) and hidden (just the final hidden state). The final state is a summary of the entire sentence.',
          deeperDive: 'output shape [1, 5, 128] means: for each of the 5 time steps, you get the 128-dim hidden state. This is useful when you need per-token representations (for tagging, attention, etc.). hidden shape [1, 1, 128] is the final hidden state after processing all 5 tokens — the first 1 is num_layers * num_directions, the second is batch_size. For a single-layer unidirectional RNN, output[:, -1, :] equals hidden.squeeze(0) — the last output IS the final hidden state. For classification tasks, you typically use only the final hidden state as the sentence representation.',
          options: ['Run forward pass and check shapes', 'Prepare input data', 'Create RNN layer', 'Import libraries'],
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
          id: 'rnn',
          code: 'rnn = nn.RNN(\n    input_size=64,\n    hidden_size=128,\n    batch_first=True\n)',
          lines: [3, 4, 5, 6, 7],
        },
        {
          id: 'input',
          code: 'x = torch.randn(1, 5, 64)',
          lines: [9],
        },
        {
          id: 'forward',
          code: 'output, hidden = rnn(x)\nprint(output.shape)\nprint(hidden.shape)',
          lines: [10, 11, 12],
        },
      ],
    },

    rewire: {
      goal: 'Use hidden_size=256 and a sequence of 10 words',
      targets: [
        {
          line: 5,
          description: 'Change hidden size',
          currentCode: '    hidden_size=128,',
          options: [
            { label: 'hidden_size=256', newCode: '    hidden_size=256,', correct: true },
            { label: 'hidden_size=64', newCode: '    hidden_size=64,', correct: false },
            { label: 'input_size=256', newCode: '    input_size=256,', correct: false },
          ],
        },
        {
          line: 9,
          description: 'Change sequence length to 10',
          currentCode: 'x = torch.randn(1, 5, 64)',
          options: [
            { label: 'torch.randn(1, 10, 64)', newCode: 'x = torch.randn(1, 10, 64)', correct: true },
            { label: 'torch.randn(10, 5, 64)', newCode: 'x = torch.randn(10, 5, 64)', correct: false },
            { label: 'torch.randn(1, 5, 256)', newCode: 'x = torch.randn(1, 5, 256)', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 5: Sentiment Classifier
  {
    id: 'sentiment_classifier',
    name: 'Sentiment Classifier',
    chapter: 1,
    description: 'Build a complete text classification model.',
    tracer: [
      { text: 'Words go through an embedding layer.', viz: 'sent_embed' },
      { text: 'An RNN reads the sequence step by step.', viz: 'sent_rnn' },
      { text: 'The final hidden state is the sentence summary.', viz: 'sent_hidden' },
      { text: 'A linear layer predicts the sentiment.', viz: 'sent_classify' },
    ],
    code: [
      'import torch.nn as nn',
      '',
      'class SentimentModel(nn.Module):',
      '    def __init__(self):',
      '        super().__init__()',
      '        self.embed = nn.Embedding(1000, 64)',
      '        self.rnn = nn.RNN(64, 128,',
      '                          batch_first=True)',
      '        self.fc = nn.Linear(128, 2)',
      '',
      '    def forward(self, x):',
      '        x = self.embed(x)',
      '        _, hidden = self.rnn(x)',
      '        out = self.fc(hidden.squeeze(0))',
      '        return out',
    ],

    xray: {
      pipeline: ['nn', 'Embed\n1000×64', 'RNN\n64→128', 'Linear\n128→2'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import neural network tools',
          explanation: 'nn has layers, activations, and the Module base class for custom models.',
          deepDive: 'We need nn.Module to build a custom model class, plus the layers we will stack inside it: Embedding, RNN, and Linear.',
          deeperDive: 'When you build a model more complex than a simple stack, you inherit from nn.Module and define __init__ (create layers) and forward (define data flow). This gives you full control over how data moves through the network — unlike nn.Sequential which can only chain layers in a straight line. nn.Module also handles parameter registration, GPU transfer, and saving/loading automatically.',
          options: ['Import neural network tools', 'Define the model class', 'Define forward pass', 'Create layers'],
        },
        {
          startLine: 2,
          endLine: 8,
          color: 'XRAY_DATA',
          correctLabel: 'Define model architecture',
          explanation: 'Three layers: Embedding (words → vectors), RNN (sequence → hidden state), Linear (hidden → classes).',
          deepDive: 'The model has three parts: an embedding table to convert word IDs to vectors, an RNN to read through the sentence, and a linear layer to classify the final hidden state as positive or negative.',
          deeperDive: 'In __init__, you declare all learnable layers. nn.Embedding(1000, 64) creates a lookup table for 1000 words with 64-dim vectors. nn.RNN(64, 128) reads the 64-dim embeddings and produces 128-dim hidden states. nn.Linear(128, 2) maps the final hidden state to 2 output classes (positive/negative). The total parameter count is: 1000×64 (embedding) + 64×128 + 128×128 + 128 + 128 (RNN) + 128×2 + 2 (linear) = roughly 89,000 parameters.',
          options: ['Define model architecture', 'Import neural network tools', 'Define forward pass', 'Make prediction'],
        },
        {
          startLine: 10,
          endLine: 14,
          color: 'XRAY_MODEL',
          correctLabel: 'Define forward pass',
          explanation: 'embed → RNN → take final hidden → linear classifier. This is the data flow.',
          deepDive: 'The forward method defines how data flows: first embed the word indices, then run the RNN, grab the final hidden state, and classify it with the linear layer.',
          deeperDive: 'In forward, x starts as integer indices of shape [batch, seq_len]. After self.embed(x), it becomes [batch, seq_len, 64]. The RNN returns (output, hidden); we use _ to discard output and keep only hidden of shape [1, batch, 128]. hidden.squeeze(0) removes the first dimension, giving [batch, 128]. Finally self.fc maps [batch, 128] to [batch, 2] — two raw scores (logits) for negative and positive sentiment. The class with the higher score is the prediction.',
          options: ['Define forward pass', 'Define model architecture', 'Import neural network tools', 'Create embedding'],
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
          id: 'class_def',
          code: 'class SentimentModel(nn.Module):\n    def __init__(self):\n        super().__init__()',
          lines: [2, 3, 4],
        },
        {
          id: 'layers',
          code: '        self.embed = nn.Embedding(1000, 64)\n        self.rnn = nn.RNN(64, 128,\n                          batch_first=True)\n        self.fc = nn.Linear(128, 2)',
          lines: [5, 6, 7, 8],
        },
        {
          id: 'forward',
          code: '    def forward(self, x):\n        x = self.embed(x)\n        _, hidden = self.rnn(x)\n        out = self.fc(hidden.squeeze(0))\n        return out',
          lines: [10, 11, 12, 13, 14],
        },
      ],
    },

    rewire: {
      goal: 'Classify into 5 star ratings instead of 2 sentiments',
      targets: [
        {
          line: 8,
          description: 'Change output classes from 2 to 5',
          currentCode: '        self.fc = nn.Linear(128, 2)',
          options: [
            { label: 'nn.Linear(128, 5)', newCode: '        self.fc = nn.Linear(128, 5)', correct: true },
            { label: 'nn.Linear(128, 3)', newCode: '        self.fc = nn.Linear(128, 3)', correct: false },
            { label: 'nn.Linear(5, 2)', newCode: '        self.fc = nn.Linear(5, 2)', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 6: Training on Text
  {
    id: 'training_on_text',
    name: 'Training on Text',
    chapter: 1,
    description: 'Train the sentiment model with loss and optimizer.',
    tracer: [
      { text: 'Feed a batch of sentences through the model.', viz: 'train_forward' },
      { text: 'CrossEntropyLoss compares predictions to labels.', viz: 'train_loss' },
      { text: 'Backward pass computes gradients.', viz: 'train_backward' },
      { text: 'Optimizer updates all weights.', viz: 'train_update' },
    ],
    code: [
      'loss_fn = nn.CrossEntropyLoss()',
      'optimizer = torch.optim.Adam(',
      '    model.parameters(), lr=0.001',
      ')',
      '',
      'for epoch in range(10):',
      '    scores = model(text_batch)',
      '    loss = loss_fn(scores, labels)',
      '',
      '    optimizer.zero_grad()',
      '    loss.backward()',
      '    optimizer.step()',
      '    print(f"Epoch {epoch}: {loss.item():.4f}")',
    ],

    xray: {
      pipeline: ['loss fn', 'optimizer', 'forward\n+ loss', 'backward\n+ step'],
      regions: [
        {
          startLine: 0,
          endLine: 3,
          color: 'XRAY_PREDICT',
          correctLabel: 'Set up loss and optimizer',
          explanation: 'CrossEntropyLoss for classification. Adam optimizer with learning rate 0.001.',
          deepDive: 'The loss function grades the model\'s predictions. The optimizer adjusts the weights to get a better grade next time. Together, they drive learning.',
          deeperDive: 'CrossEntropyLoss is the standard for classification. It internally applies softmax to the raw scores and then computes negative log-likelihood. For a 2-class problem with correct class 1, if the model outputs [0.3, 2.1], softmax gives [0.14, 0.86], and the loss is -log(0.86) = 0.15. Adam optimizer combines momentum (remembers past gradients) with adaptive learning rates (adjusts per parameter). lr=0.001 is a common starting point for NLP tasks. model.parameters() iterates over all trainable weights in the model, including embedding weights, RNN weights, and linear weights.',
          options: ['Set up loss and optimizer', 'Forward pass', 'Backward pass', 'Update weights'],
        },
        {
          startLine: 5,
          endLine: 7,
          color: 'XRAY_DATA',
          correctLabel: 'Forward pass and compute loss',
          explanation: 'Feed text through the model, then measure how wrong the predictions are.',
          deepDive: 'The model makes predictions for each sentence in the batch. The loss function checks these against the true labels (positive/negative) and gives a score — lower is better.',
          deeperDive: 'model(text_batch) runs the full forward pass: embedding lookup, RNN processing, and linear classification. text_batch has shape [batch_size, seq_len] with integer word indices. scores has shape [batch_size, 2] with raw logits for each class. labels has shape [batch_size] with the correct class index (0 or 1) for each sentence. CrossEntropyLoss averages the per-sample losses across the batch, giving a single scalar loss value.',
          options: ['Forward pass and compute loss', 'Set up loss and optimizer', 'Update weights', 'Print results'],
        },
        {
          startLine: 9,
          endLine: 11,
          color: 'XRAY_TRAIN',
          correctLabel: 'Backward pass and update',
          explanation: 'zero_grad clears old gradients, backward computes new ones, step updates weights.',
          deepDive: 'Three-step recipe: clear the slate, figure out which direction to nudge each weight, then nudge them. This happens every batch.',
          deeperDive: 'optimizer.zero_grad() resets all .grad attributes to zero so gradients from the previous iteration do not accumulate. loss.backward() applies the chain rule through the entire computation graph — from loss, through the linear layer, through the RNN\'s unrolled time steps, through the embedding lookup. This computes d(loss)/d(weight) for every parameter. optimizer.step() applies the Adam update rule to each parameter. For NLP models, gradients flow backward through each RNN time step, which can cause vanishing gradients in long sequences — this is why LSTMs and GRUs were invented.',
          options: ['Backward pass and update', 'Forward pass and compute loss', 'Set up loss and optimizer', 'Print results'],
        },
        {
          startLine: 12,
          endLine: 12,
          color: 'XRAY_MODEL',
          correctLabel: 'Print training progress',
          explanation: 'Show the loss after each epoch. It should decrease over time.',
          deepDive: 'Printing the loss each epoch lets you see if the model is learning. A decreasing loss means the model is getting better at predicting sentiment.',
          deeperDive: 'loss.item() extracts the Python float from the loss tensor, which is important to avoid accumulating computation graphs in memory. The :.4f format shows 4 decimal places. For a 2-class problem, random guessing gives a loss of -log(0.5) = 0.693. If training works, you should see the loss drop well below 0.693 within a few epochs. If the loss plateaus above 0.693, something is wrong — check the data, learning rate, or model architecture.',
          options: ['Print training progress', 'Backward pass and update', 'Forward pass', 'Set up loss function'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'setup',
          code: 'loss_fn = nn.CrossEntropyLoss()\noptimizer = torch.optim.Adam(\n    model.parameters(), lr=0.001\n)',
          lines: [0, 1, 2, 3],
        },
        {
          id: 'forward',
          code: 'for epoch in range(10):\n    scores = model(text_batch)\n    loss = loss_fn(scores, labels)',
          lines: [5, 6, 7],
        },
        {
          id: 'backward',
          code: '    optimizer.zero_grad()\n    loss.backward()\n    optimizer.step()',
          lines: [9, 10, 11],
        },
        {
          id: 'print',
          code: '    print(f"Epoch {epoch}: {loss.item():.4f}")',
          lines: [12],
        },
      ],
    },

    rewire: {
      goal: 'Use SGD optimizer with learning rate 0.01',
      targets: [
        {
          line: 1,
          description: 'Change the optimizer',
          currentCode: 'optimizer = torch.optim.Adam(',
          options: [
            { label: 'torch.optim.SGD(', newCode: 'optimizer = torch.optim.SGD(', correct: true },
            { label: 'torch.optim.Adam(', newCode: 'optimizer = torch.optim.Adam(', correct: false },
            { label: 'nn.CrossEntropyLoss(', newCode: 'optimizer = nn.CrossEntropyLoss(', correct: false },
          ],
        },
        {
          line: 2,
          description: 'Change the learning rate',
          currentCode: '    model.parameters(), lr=0.001',
          options: [
            { label: 'lr=0.01', newCode: '    model.parameters(), lr=0.01', correct: true },
            { label: 'lr=0.001', newCode: '    model.parameters(), lr=0.001', correct: false },
            { label: 'lr=0.1', newCode: '    model.parameters(), lr=0.1', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 3: Applications
  // ================================================================

  // LESSON 7: Word Similarity
  {
    id: 'word_similarity',
    name: 'Word Similarity',
    chapter: 2,
    description: 'Compare word meanings using cosine similarity.',
    tracer: [
      { text: 'Each word has an embedding vector.', viz: 'sim_vectors' },
      { text: 'Cosine similarity measures direction alignment.', viz: 'sim_cosine' },
      { text: 'Similar words have high cosine similarity.', viz: 'sim_high' },
    ],
    code: [
      'import torch',
      'import torch.nn as nn',
      'import torch.nn.functional as F',
      '',
      'embedding = nn.Embedding(1000, 64)',
      '',
      'word_a = embedding(torch.tensor([42]))',
      'word_b = embedding(torch.tensor([87]))',
      '',
      'similarity = F.cosine_similarity(',
      '    word_a, word_b',
      ')',
      'print(f"Similarity: {similarity.item():.4f}")',
    ],

    xray: {
      pipeline: ['imports', 'Embedding', 'lookup', 'cosine_sim'],
      regions: [
        {
          startLine: 0,
          endLine: 2,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'torch for tensors, nn for Embedding, F for cosine_similarity.',
          deepDive: 'torch.nn.functional (imported as F) has stateless functions like cosine_similarity, softmax, and relu. Unlike nn layers, these do not store any learnable parameters.',
          deeperDive: 'The functional module (torch.nn.functional) provides the same operations as nn layers but as plain functions rather than objects. F.cosine_similarity is a pure function — it takes two tensors and returns a similarity score. You use functional when you do not need learnable parameters. Other useful F functions include F.softmax, F.relu, F.cross_entropy, and F.normalize. The convention of importing as F is universal in PyTorch code.',
          options: ['Import libraries', 'Create embedding', 'Look up words', 'Compute similarity'],
        },
        {
          startLine: 4,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Create embedding layer',
          explanation: 'A vocabulary of 1000 words, each mapped to a 64-dimensional vector.',
          deepDive: 'Same embedding table as before — 1000 rows of 64-dim vectors. In a trained model, these vectors would encode word meaning.',
          deeperDive: 'In this example the embeddings are randomly initialized, so similarity scores will be arbitrary. In a real application, you would either train the embeddings on your own data (by attaching them to a model and running backpropagation) or load pre-trained embeddings like Word2Vec, GloVe, or FastText. Pre-trained embeddings have the property that semantically similar words (king/queen, cat/dog) have high cosine similarity, while unrelated words (king/banana) have low similarity.',
          options: ['Create embedding layer', 'Import libraries', 'Look up word vectors', 'Compute similarity'],
        },
        {
          startLine: 6,
          endLine: 7,
          color: 'XRAY_MODEL',
          correctLabel: 'Look up two word vectors',
          explanation: 'Get the 64-dim embedding for word 42 and word 87.',
          deepDive: 'Each word index gets looked up in the embedding table, returning its 64-number vector representation. These vectors capture word meaning after training.',
          deeperDive: 'embedding(torch.tensor([42])) returns a tensor of shape [1, 64] — one word, 64 dimensions. The input must be a tensor (not a plain Python int). The square brackets create a 1D tensor of one element, so the output has a batch dimension. Both word_a and word_b have shape [1, 64], which is the correct format for F.cosine_similarity to compare them element-wise along the feature dimension.',
          options: ['Look up two word vectors', 'Create embedding', 'Import libraries', 'Print similarity'],
        },
        {
          startLine: 9,
          endLine: 12,
          color: 'XRAY_PREDICT',
          correctLabel: 'Compute and print cosine similarity',
          explanation: 'Cosine similarity ranges from -1 to 1. Closer to 1 means more similar.',
          deepDive: 'Cosine similarity measures how closely two vectors point in the same direction. A score of 1.0 means identical direction, 0.0 means perpendicular, -1.0 means opposite.',
          deeperDive: 'The formula is: cos(a, b) = (a · b) / (||a|| × ||b||). The dot product measures alignment, and dividing by the magnitudes normalizes for vector length. F.cosine_similarity computes this along the last dimension by default (dim=1). For random 64-dim vectors, the expected cosine similarity is close to 0 — neither similar nor dissimilar. After training on text data, semantically related words converge to similar directions in the embedding space. For example, with GloVe embeddings, cosine_similarity("king", "queen") ≈ 0.65.',
          options: ['Compute and print cosine similarity', 'Look up word vectors', 'Create embedding', 'Import libraries'],
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
          id: 'embedding',
          code: 'embedding = nn.Embedding(1000, 64)',
          lines: [4],
        },
        {
          id: 'lookup',
          code: 'word_a = embedding(torch.tensor([42]))\nword_b = embedding(torch.tensor([87]))',
          lines: [6, 7],
        },
        {
          id: 'similarity',
          code: 'similarity = F.cosine_similarity(\n    word_a, word_b\n)\nprint(f"Similarity: {similarity.item():.4f}")',
          lines: [9, 10, 11, 12],
        },
      ],
    },

    rewire: {
      goal: 'Compare three words at once using a batch',
      targets: [
        {
          line: 6,
          description: 'Look up 3 words instead of 1',
          currentCode: 'word_a = embedding(torch.tensor([42]))',
          options: [
            { label: 'torch.tensor([42, 15, 88])', newCode: 'word_a = embedding(torch.tensor([42, 15, 88]))', correct: true },
            { label: 'torch.tensor([42])', newCode: 'word_a = embedding(torch.tensor([42]))', correct: false },
            { label: 'torch.tensor(42)', newCode: 'word_a = embedding(torch.tensor(42))', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 8: Text Generation
  {
    id: 'text_generation',
    name: 'Text Generation',
    chapter: 2,
    description: 'Generate text one word at a time with sampling.',
    tracer: [
      { text: 'Start with a seed word.', viz: 'gen_seed' },
      { text: 'The model predicts the next word.', viz: 'gen_predict' },
      { text: 'Softmax converts scores to probabilities.', viz: 'gen_softmax' },
      { text: 'Sample from the distribution and repeat.', viz: 'gen_loop' },
    ],
    code: [
      'model.eval()',
      'input_ids = torch.tensor([[seed_id]])',
      'generated = [seed_id]',
      '',
      'for _ in range(20):',
      '    with torch.no_grad():',
      '        logits = model(input_ids)',
      '    probs = torch.softmax(logits[:, -1], dim=-1)',
      '    next_id = torch.multinomial(probs, 1)',
      '    generated.append(next_id.item())',
      '    input_ids = next_id.unsqueeze(0)',
      '',
      'print(generated)',
    ],

    xray: {
      pipeline: ['eval', 'seed', 'predict\nloop', 'softmax\n+ sample'],
      regions: [
        {
          startLine: 0,
          endLine: 2,
          color: 'XRAY_IMPORT',
          correctLabel: 'Set up for generation',
          explanation: 'model.eval() disables dropout. Start with a seed word and an empty output list.',
          deepDive: 'Switching to eval mode turns off training-only features like dropout. The seed word is the starting point — the model will predict what comes next.',
          deeperDive: 'model.eval() sets the model to evaluation mode, which disables dropout (random neuron masking) and changes batch normalization behavior. This ensures deterministic outputs. input_ids shape [1, 1] means one batch with one token. generated is a Python list that will accumulate the generated word indices. The seed_id is typically a special <START> token or a user-provided word. The generation loop will extend this sequence one token at a time.',
          options: ['Set up for generation', 'Run prediction loop', 'Apply softmax', 'Sample next word'],
        },
        {
          startLine: 4,
          endLine: 6,
          color: 'XRAY_DATA',
          correctLabel: 'Predict next word scores',
          explanation: 'For each step, the model predicts scores for every word in the vocabulary.',
          deepDive: 'Inside a no_grad block (faster, no training), the model reads the current input and outputs a score for every possible next word.',
          deeperDive: 'torch.no_grad() disables gradient tracking for speed and memory savings — we are generating, not training. model(input_ids) runs the full forward pass (embedding → RNN → linear) and returns logits of shape [1, seq_len, vocab_size]. We iterate 20 times to generate 20 new words. At each step, the model sees the input and predicts scores for every word in the vocabulary. The range(20) controls the output length.',
          options: ['Predict next word scores', 'Set up for generation', 'Sample next word', 'Print output'],
        },
        {
          startLine: 7,
          endLine: 8,
          color: 'XRAY_MODEL',
          correctLabel: 'Softmax and sample',
          explanation: 'Softmax converts scores to probabilities. multinomial samples a word from the distribution.',
          deepDive: 'Softmax turns the raw scores into probabilities that sum to 1. Then multinomial randomly picks a word, with higher-probability words more likely to be chosen.',
          deeperDive: 'logits[:, -1] extracts the last token\'s predictions — shape [1, vocab_size]. torch.softmax along dim=-1 converts logits to probabilities. torch.multinomial(probs, 1) randomly draws 1 sample from the categorical distribution. Higher probabilities mean higher chance of selection, but any word with non-zero probability can be picked. This randomness is what makes generation creative and non-repetitive. An alternative is greedy decoding (probs.argmax()), which always picks the most likely word but produces repetitive text.',
          options: ['Softmax and sample', 'Predict next word', 'Set up for generation', 'Append to output'],
        },
        {
          startLine: 9,
          endLine: 12,
          color: 'XRAY_PREDICT',
          correctLabel: 'Append and continue',
          explanation: 'Add the predicted word to the list. Feed it back as the next input and repeat.',
          deepDive: 'The sampled word gets added to the growing output list, and then it becomes the new input for the next iteration — this is called autoregressive generation.',
          deeperDive: 'next_id.item() extracts the integer from the tensor and appends it to generated. next_id.unsqueeze(0) reshapes the token to [1, 1] so it can be fed back as input_ids for the next iteration. This is autoregressive generation: each predicted token becomes part of the input for predicting the next token. After the loop, generated is a list of 21 integers (seed + 20 generated). To convert back to text, you would reverse the vocabulary mapping: idx_to_word = {v: k for k, v in vocab.items()}.',
          options: ['Append and continue', 'Softmax and sample', 'Predict next word', 'Set up generation'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'setup',
          code: 'model.eval()\ninput_ids = torch.tensor([[seed_id]])\ngenerated = [seed_id]',
          lines: [0, 1, 2],
        },
        {
          id: 'predict',
          code: 'for _ in range(20):\n    with torch.no_grad():\n        logits = model(input_ids)',
          lines: [4, 5, 6],
        },
        {
          id: 'sample',
          code: '    probs = torch.softmax(logits[:, -1], dim=-1)\n    next_id = torch.multinomial(probs, 1)',
          lines: [7, 8],
        },
        {
          id: 'append',
          code: '    generated.append(next_id.item())\n    input_ids = next_id.unsqueeze(0)',
          lines: [9, 10],
        },
        {
          id: 'print',
          code: 'print(generated)',
          lines: [12],
        },
      ],
    },

    rewire: {
      goal: 'Generate 50 words instead of 20',
      targets: [
        {
          line: 4,
          description: 'Change the generation length',
          currentCode: 'for _ in range(20):',
          options: [
            { label: 'range(50)', newCode: 'for _ in range(50):', correct: true },
            { label: 'range(10)', newCode: 'for _ in range(10):', correct: false },
            { label: 'range(100)', newCode: 'for _ in range(100):', correct: false },
          ],
        },
      ],
    },
  },
];
