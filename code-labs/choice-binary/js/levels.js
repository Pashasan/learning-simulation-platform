// ============================================================
// LEVELS — 8 Lessons across 3 Chapters with X-Ray / Assemble / Rewire rounds
// Discrete Choice 1: Logistic Regression for Binary Outcomes (BeatBox Earbuds)
// ============================================================

export const LEVELS = [
  // ================================================================
  // CHAPTER 1: Binary Outcomes
  // ================================================================

  // LESSON 1: Binary Outcomes
  {
    id: 'binary_outcomes',
    name: 'Binary Outcomes',
    chapter: 0,
    description: 'Load a dataset and explore binary purchase data.',
    tracer: [
      { text: 'A survey asks: did you buy BeatBox earbuds?', viz: 'binary_survey' },
      { text: 'Each row is one customer. Bought = 1, Not = 0.', viz: 'binary_rows' },
      { text: 'value_counts shows how many bought vs. not.', viz: 'binary_counts' },
    ],
    code: [
      'import pandas as pd',
      '',
      'df = pd.read_csv("beatbox.csv")',
      'print(df.head())',
      '',
      'print(df["bought"].value_counts())',
    ],

    xray: {
      pipeline: ['import', 'load\ndata', 'explore'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import pandas',
          explanation: 'pandas is the standard library for working with tabular data in Python.',
          deepDive: 'pandas gives you DataFrames -- spreadsheet-like tables in Python. The "as pd" shortcut means you type pd instead of pandas every time you use it.',
          deeperDive: 'pandas (Panel Data) is built on top of NumPy and provides two key data structures: Series (1D labeled array) and DataFrame (2D labeled table with columns of potentially different types). Importing "as pd" is a universal convention -- virtually every data science tutorial and codebase uses this alias. pandas handles reading CSV, Excel, SQL, and JSON files, data cleaning (missing values, duplicates), filtering, grouping, merging, and basic statistics. It is typically the first library you import in any data analysis project.',
          options: ['Import pandas', 'Load the dataset', 'Print summary statistics', 'Create a model'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Load and preview data',
          explanation: 'read_csv loads the file into a DataFrame. head() shows the first 5 rows.',
          deepDive: 'read_csv turns a comma-separated file into a table you can work with. head() gives you a quick peek at the first 5 rows so you know what the data looks like before doing anything else.',
          deeperDive: 'pd.read_csv() is the most common way to load data. It automatically detects column names from the first row, infers data types (int, float, string), and handles common issues like quoted strings and different delimiters. The "beatbox.csv" file contains columns like age, income, ad_exposure, and bought (0 or 1). head() returns the first 5 rows by default, but you can pass a number like head(10) to see more. Other preview methods include df.tail() (last rows), df.shape (row/column counts), df.info() (column types and null counts), and df.describe() (summary statistics).',
          options: ['Load and preview data', 'Import pandas', 'Count outcomes', 'Fit a model'],
        },
        {
          startLine: 5,
          endLine: 5,
          color: 'XRAY_PREDICT',
          correctLabel: 'Count outcome frequencies',
          explanation: 'value_counts shows how many 0s and 1s are in the "bought" column.',
          deepDive: 'value_counts is like tallying votes. It counts how many customers bought (1) vs. did not buy (0), giving you the balance of your dataset at a glance.',
          deeperDive: 'value_counts() returns a Series sorted by frequency. For a binary outcome like "bought", you get something like: 0 -> 620, 1 -> 380. This tells you the class balance -- here, 38% bought and 62% did not. Class imbalance matters because a model that always predicts "not bought" would be 62% accurate without learning anything. You can normalize with value_counts(normalize=True) to get proportions instead of counts. Understanding your outcome distribution is always the first step before building a classification model.',
          options: ['Count outcome frequencies', 'Load and preview data', 'Import pandas', 'Train a model'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'import pandas as pd',
          lines: [0],
        },
        {
          id: 'load',
          code: 'df = pd.read_csv("beatbox.csv")\nprint(df.head())',
          lines: [2, 3],
        },
        {
          id: 'counts',
          code: 'print(df["bought"].value_counts())',
          lines: [5],
        },
      ],
    },

    rewire: {
      goal: 'Show the last 10 rows instead of the first 5',
      targets: [
        {
          line: 3,
          description: 'Change the preview method',
          currentCode: 'print(df.head())',
          options: [
            { label: 'df.tail(10)', newCode: 'print(df.tail(10))', correct: true },
            { label: 'df.head(10)', newCode: 'print(df.head(10))', correct: false },
            { label: 'df.sample(10)', newCode: 'print(df.sample(10))', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 2: The S-Curve
  {
    id: 'the_s_curve',
    name: 'The S-Curve',
    chapter: 0,
    description: 'Understand the sigmoid function that maps any number to a probability.',
    tracer: [
      { text: 'Linear predictions can go below 0 or above 1.', viz: 'scurve_linear' },
      { text: 'The sigmoid squashes everything to 0-1.', viz: 'scurve_sigmoid' },
      { text: 'Output is a probability of buying.', viz: 'scurve_probability' },
    ],
    code: [
      'import numpy as np',
      'from scipy.special import expit',
      '',
      'z = np.linspace(-6, 6, 100)',
      'p = expit(z)',
      '',
      'print(f"expit(-6) = {expit(-6):.4f}")',
      'print(f"expit(0)  = {expit(0):.4f}")',
      'print(f"expit(6)  = {expit(6):.4f}")',
    ],

    xray: {
      pipeline: ['imports', 'inputs', 'sigmoid', 'print'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import math tools',
          explanation: 'numpy for arrays, expit is the sigmoid function from scipy.',
          deepDive: 'numpy handles arrays of numbers efficiently. expit is scipy\'s name for the sigmoid function -- it takes any number and squashes it between 0 and 1.',
          deeperDive: 'numpy (Numerical Python) provides ndarray, a fast multi-dimensional array type that supports vectorized operations -- meaning you can apply math to millions of numbers at once without writing loops. scipy.special.expit is the numerically stable implementation of the sigmoid function: sigma(z) = 1 / (1 + exp(-z)). It is called "expit" because it is the inverse of the logit function. Using scipy\'s version instead of coding it yourself avoids numerical overflow issues when z is very large or very small.',
          options: ['Import math tools', 'Generate input values', 'Apply sigmoid', 'Print results'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Generate inputs and apply sigmoid',
          explanation: 'linspace makes 100 evenly spaced numbers from -6 to 6. expit converts them to probabilities.',
          deepDive: 'linspace creates a smooth range of test inputs. Feeding them through expit shows how the S-curve maps any value to a probability between 0 and 1.',
          deeperDive: 'np.linspace(-6, 6, 100) creates an array of 100 equally spaced values: [-6.0, -5.88, -5.76, ..., 5.76, 5.88, 6.0]. This is the "z" or "log-odds" axis. Applying expit to the entire array at once (vectorized operation) is much faster than a Python loop. The result p is an array of 100 probabilities. At z = -6, p is nearly 0 (0.0025). At z = 0, p is exactly 0.5. At z = 6, p is nearly 1 (0.9975). The transition from low to high probability happens in the middle range (-3 to 3), creating the characteristic S-shape.',
          options: ['Generate inputs and apply sigmoid', 'Import math tools', 'Print boundary values', 'Plot the curve'],
        },
        {
          startLine: 6,
          endLine: 8,
          color: 'XRAY_PREDICT',
          correctLabel: 'Print boundary values',
          explanation: 'Shows the sigmoid at three key points: far negative, zero, and far positive.',
          deepDive: 'At -6 the probability is near 0 (almost certainly not buying). At 0 it is exactly 0.5 (coin flip). At 6 it is near 1 (almost certainly buying). These three points capture the sigmoid\'s behavior.',
          deeperDive: 'The three values demonstrate the sigmoid\'s key properties: (1) For large negative z, expit approaches 0 -- the model is confident the customer will NOT buy. (2) At z = 0, expit is exactly 0.5 -- maximum uncertainty, a coin flip. (3) For large positive z, expit approaches 1 -- the model is confident the customer WILL buy. The "z" value in logistic regression is a linear combination of features: z = b0 + b1*age + b2*income + ... The sigmoid converts this unbounded number into a valid probability. The threshold z = 0 (p = 0.5) is the default decision boundary for classification.',
          options: ['Print boundary values', 'Generate inputs', 'Import math tools', 'Fit a model'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'imports',
          code: 'import numpy as np\nfrom scipy.special import expit',
          lines: [0, 1],
        },
        {
          id: 'generate',
          code: 'z = np.linspace(-6, 6, 100)\np = expit(z)',
          lines: [3, 4],
        },
        {
          id: 'print',
          code: 'print(f"expit(-6) = {expit(-6):.4f}")\nprint(f"expit(0)  = {expit(0):.4f}")\nprint(f"expit(6)  = {expit(6):.4f}")',
          lines: [6, 7, 8],
        },
      ],
    },

    rewire: {
      goal: 'Use a wider range from -10 to 10',
      targets: [
        {
          line: 3,
          description: 'Change the input range',
          currentCode: 'z = np.linspace(-6, 6, 100)',
          options: [
            { label: 'np.linspace(-10, 10, 100)', newCode: 'z = np.linspace(-10, 10, 100)', correct: true },
            { label: 'np.linspace(-3, 3, 100)', newCode: 'z = np.linspace(-3, 3, 100)', correct: false },
            { label: 'np.linspace(0, 10, 100)', newCode: 'z = np.linspace(0, 10, 100)', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 3: Fit Logistic Regression
  {
    id: 'fit_logistic',
    name: 'Fit Logistic Regression',
    chapter: 0,
    description: 'Train a logistic regression model on purchase data.',
    tracer: [
      { text: 'Separate features (X) from the outcome (y).', viz: 'fit_split' },
      { text: 'LogisticRegression learns the best weights.', viz: 'fit_model' },
      { text: 'Coefficients show each feature\'s influence.', viz: 'fit_coefs' },
    ],
    code: [
      'from sklearn.linear_model import LogisticRegression',
      '',
      'X = df[["age", "income", "ad_exposure"]]',
      'y = df["bought"]',
      '',
      'model = LogisticRegression()',
      'model.fit(X, y)',
      '',
      'print(model.coef_)',
      'print(model.intercept_)',
    ],

    xray: {
      pipeline: ['import', 'X, y', 'fit', 'coef'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import the model class',
          explanation: 'sklearn provides ready-made machine learning models including LogisticRegression.',
          deepDive: 'scikit-learn (sklearn) is the standard machine learning library for Python. LogisticRegression is one of many model classes it provides, all sharing the same fit/predict interface.',
          deeperDive: 'scikit-learn follows a consistent API: every model has fit() to train, predict() to make predictions, and score() to evaluate. LogisticRegression is in the linear_model submodule alongside Ridge, Lasso, and ElasticNet. Despite the name, logistic regression is a classification algorithm (not regression) because it predicts discrete categories. It is called "regression" for historical reasons -- it regresses on the log-odds of the outcome. Under the hood, sklearn uses a solver (default: lbfgs) to find weights that maximize the likelihood of the observed data.',
          options: ['Import the model class', 'Split features and target', 'Train the model', 'Print coefficients'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Split features and target',
          explanation: 'X holds the input features (age, income, ad_exposure). y holds what we want to predict (bought).',
          deepDive: 'X is the table of things we know about each customer. y is the answer column -- did they buy or not. The model learns how X relates to y.',
          deeperDive: 'X is a DataFrame with shape (n_samples, 3) containing the three predictor variables. y is a Series with shape (n_samples,) containing the binary outcome. The double brackets df[["age", "income", "ad_exposure"]] create a DataFrame (2D), while single brackets df["bought"] create a Series (1D). sklearn requires X to be 2D (even for a single feature, you would need df[["age"]]) and y to be 1D. The names X and y are conventions from statistics: X for the design matrix of features, y for the response variable.',
          options: ['Split features and target', 'Import the model class', 'Train the model', 'Print coefficients'],
        },
        {
          startLine: 5,
          endLine: 6,
          color: 'XRAY_MODEL',
          correctLabel: 'Create and train the model',
          explanation: 'LogisticRegression() creates the model. fit() learns the best weights from the data.',
          deepDive: 'Creating the model is like setting up an empty brain. Calling fit(X, y) is the training step -- the model examines the data and figures out which features best predict buying.',
          deeperDive: 'LogisticRegression() accepts many hyperparameters: C (inverse regularization strength, default 1.0), penalty ("l2" by default), solver ("lbfgs" by default), and max_iter (default 100). The fit() method finds coefficient values that maximize the log-likelihood of the data -- equivalent to finding the S-curve that best separates buyers from non-buyers. The optimization uses the L-BFGS algorithm, which is a quasi-Newton method that approximates the Hessian matrix for efficient convergence. If you get a ConvergenceWarning, try increasing max_iter.',
          options: ['Create and train the model', 'Split features and target', 'Import the model class', 'Print results'],
        },
        {
          startLine: 8,
          endLine: 9,
          color: 'XRAY_PREDICT',
          correctLabel: 'Inspect learned parameters',
          explanation: 'coef_ shows feature weights. intercept_ is the baseline log-odds.',
          deepDive: 'coef_ tells you how much each feature contributes to the prediction. A positive coefficient means that feature increases the chance of buying. intercept_ is the starting point before features are considered.',
          deeperDive: 'model.coef_ returns a 2D array of shape (1, n_features) -- for example [[0.03, 0.0001, 0.45]]. Each value is the change in log-odds per one-unit increase in that feature, holding others constant. So if the ad_exposure coefficient is 0.45, each additional ad view increases the log-odds of buying by 0.45. model.intercept_ is a 1D array containing the bias term (the log-odds when all features are zero). Together, the prediction is: z = intercept + coef[0]*age + coef[1]*income + coef[2]*ad_exposure, then p = sigmoid(z).',
          options: ['Inspect learned parameters', 'Create and train the model', 'Split features and target', 'Import the model class'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'from sklearn.linear_model import LogisticRegression',
          lines: [0],
        },
        {
          id: 'split',
          code: 'X = df[["age", "income", "ad_exposure"]]\ny = df["bought"]',
          lines: [2, 3],
        },
        {
          id: 'fit',
          code: 'model = LogisticRegression()\nmodel.fit(X, y)',
          lines: [5, 6],
        },
        {
          id: 'coef',
          code: 'print(model.coef_)\nprint(model.intercept_)',
          lines: [8, 9],
        },
      ],
    },

    rewire: {
      goal: 'Use only age and income as features (drop ad_exposure)',
      targets: [
        {
          line: 2,
          description: 'Change the feature columns',
          currentCode: 'X = df[["age", "income", "ad_exposure"]]',
          options: [
            { label: 'df[["age", "income"]]', newCode: 'X = df[["age", "income"]]', correct: true },
            { label: 'df[["age", "ad_exposure"]]', newCode: 'X = df[["age", "ad_exposure"]]', correct: false },
            { label: 'df[["income"]]', newCode: 'X = df[["income"]]', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 2: Classification
  // ================================================================

  // LESSON 4: Predicted Probabilities
  {
    id: 'predicted_probabilities',
    name: 'Predicted Probabilities',
    chapter: 1,
    description: 'Get predicted probabilities and apply a threshold.',
    tracer: [
      { text: 'predict_proba gives a probability for each class.', viz: 'prob_bars' },
      { text: 'A threshold (e.g. 0.5) converts probability to a label.', viz: 'prob_threshold' },
      { text: 'Different thresholds trade off precision and recall.', viz: 'prob_tradeoff' },
    ],
    code: [
      'probs = model.predict_proba(X)',
      'p_buy = probs[:, 1]',
      '',
      'threshold = 0.5',
      'y_pred = (p_buy >= threshold).astype(int)',
      '',
      'print(f"First 5 probabilities: {p_buy[:5]}")',
      'print(f"First 5 predictions:   {y_pred[:5]}")',
    ],

    xray: {
      pipeline: ['proba', 'extract\np(buy)', 'threshold', 'print'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_MODEL',
          correctLabel: 'Get class probabilities',
          explanation: 'predict_proba returns a 2-column array: P(not buy) and P(buy). We take column 1.',
          deepDive: 'The model gives two numbers per customer: the chance of not buying and the chance of buying. They always add up to 1. We grab the second column (index 1) for the buying probability.',
          deeperDive: 'predict_proba(X) returns an array of shape (n_samples, 2). Column 0 is P(y=0) and column 1 is P(y=1). For binary classification, column 1 = 1 - column 0, so you only need one. The notation probs[:, 1] uses NumPy slicing: ":" means all rows, "1" means column index 1. These probabilities come from applying the sigmoid to the linear combination of features: P(buy) = sigmoid(intercept + sum(coef_i * feature_i)). Unlike predict() which returns hard labels (0 or 1), predict_proba() preserves the full probability information, giving you more flexibility in decision-making.',
          options: ['Get class probabilities', 'Apply threshold', 'Print results', 'Fit the model'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_PREDICT',
          correctLabel: 'Apply decision threshold',
          explanation: 'If probability >= 0.5, predict "bought" (1). Otherwise predict "not bought" (0).',
          deepDive: 'The threshold is the cutoff line. Above 0.5 means "predict buy," below means "predict no buy." Changing this number shifts how aggressive or cautious the model is.',
          deeperDive: 'The comparison p_buy >= threshold creates a boolean array (True/False). astype(int) converts True to 1 and False to 0, giving us hard predictions. The default threshold of 0.5 is not always optimal. In medical screening, you might lower it to 0.3 to catch more positive cases (higher recall). In fraud detection, you might raise it to 0.8 to reduce false alarms (higher precision). The optimal threshold depends on the relative costs of false positives vs. false negatives in your specific problem.',
          options: ['Apply decision threshold', 'Get class probabilities', 'Print results', 'Evaluate accuracy'],
        },
        {
          startLine: 6,
          endLine: 7,
          color: 'XRAY_TRAIN',
          correctLabel: 'Compare probabilities and labels',
          explanation: 'Shows the raw probability alongside the binary prediction for the first 5 rows.',
          deepDive: 'Printing both lets you see the model\'s confidence. A probability of 0.91 becomes prediction 1 (bought), while 0.32 becomes 0 (not bought). The threshold decides where the cut happens.',
          deeperDive: 'Examining individual predictions is an important sanity check. You might see: probabilities [0.91, 0.32, 0.67, 0.12, 0.55] become predictions [1, 0, 1, 0, 1]. Notice that 0.55 is just barely above the 0.5 threshold -- such borderline cases are where the model is least confident. In practice, you can use the probability itself rather than a hard cutoff: for example, ranking customers by purchase probability to target marketing at the top N percent, regardless of any specific threshold.',
          options: ['Compare probabilities and labels', 'Apply threshold', 'Get class probabilities', 'Fit the model'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'proba',
          code: 'probs = model.predict_proba(X)\np_buy = probs[:, 1]',
          lines: [0, 1],
        },
        {
          id: 'threshold',
          code: 'threshold = 0.5\ny_pred = (p_buy >= threshold).astype(int)',
          lines: [3, 4],
        },
        {
          id: 'print',
          code: 'print(f"First 5 probabilities: {p_buy[:5]}")\nprint(f"First 5 predictions:   {y_pred[:5]}")',
          lines: [6, 7],
        },
      ],
    },

    rewire: {
      goal: 'Use a stricter threshold of 0.7',
      targets: [
        {
          line: 3,
          description: 'Change the threshold value',
          currentCode: 'threshold = 0.5',
          options: [
            { label: 'threshold = 0.7', newCode: 'threshold = 0.7', correct: true },
            { label: 'threshold = 0.3', newCode: 'threshold = 0.3', correct: false },
            { label: 'threshold = 1.0', newCode: 'threshold = 1.0', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 5: Confusion Matrix
  {
    id: 'confusion_matrix',
    name: 'Confusion Matrix',
    chapter: 1,
    description: 'Evaluate predictions with a confusion matrix.',
    tracer: [
      { text: 'Every prediction is TP, TN, FP, or FN.', viz: 'cm_quadrants' },
      { text: 'The confusion matrix counts each type.', viz: 'cm_matrix' },
      { text: 'Accuracy = (TP + TN) / total.', viz: 'cm_accuracy' },
    ],
    code: [
      'from sklearn.metrics import confusion_matrix',
      '',
      'cm = confusion_matrix(y, y_pred)',
      'tn, fp, fn, tp = cm.ravel()',
      '',
      'print(f"TN={tn}  FP={fp}")',
      'print(f"FN={fn}  TP={tp}")',
      '',
      'accuracy = (tp + tn) / (tp + tn + fp + fn)',
      'print(f"Accuracy: {accuracy:.2%}")',
    ],

    xray: {
      pipeline: ['import', 'compute\nCM', 'unpack', 'accuracy'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import confusion matrix',
          explanation: 'sklearn.metrics has tools to evaluate how well your model performs.',
          deepDive: 'The metrics module is sklearn\'s report card. It contains functions to measure accuracy, precision, recall, F1, AUC, and more. confusion_matrix is one of the most fundamental.',
          deeperDive: 'sklearn.metrics contains over 40 evaluation functions organized by task. For classification: confusion_matrix, accuracy_score, precision_score, recall_score, f1_score, roc_curve, roc_auc_score, classification_report. For regression: mean_squared_error, r2_score, mean_absolute_error. confusion_matrix takes two arrays (y_true, y_pred) and returns a 2x2 matrix for binary classification. The import path sklearn.metrics.confusion_matrix follows sklearn\'s modular organization.',
          options: ['Import confusion matrix', 'Compute the matrix', 'Unpack the values', 'Calculate accuracy'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Compute and unpack the matrix',
          explanation: 'confusion_matrix compares true vs. predicted. ravel() flattens it to TN, FP, FN, TP.',
          deepDive: 'The confusion matrix is a 2x2 grid. ravel() reads it left-to-right, top-to-bottom into four numbers: True Negatives, False Positives, False Negatives, True Positives.',
          deeperDive: 'confusion_matrix(y, y_pred) returns a 2x2 numpy array: [[TN, FP], [FN, TP]]. The rows represent actual classes (row 0 = actual negative, row 1 = actual positive) and columns represent predicted classes (col 0 = predicted negative, col 1 = predicted positive). ravel() flattens this 2D array into 1D in row-major order: [TN, FP, FN, TP]. True Negative: correctly predicted "no buy." False Positive: predicted "buy" but actually "no buy" (Type I error). False Negative: predicted "no buy" but actually "buy" (Type II error). True Positive: correctly predicted "buy."',
          options: ['Compute and unpack the matrix', 'Import confusion matrix', 'Calculate accuracy', 'Print results'],
        },
        {
          startLine: 5,
          endLine: 6,
          color: 'XRAY_MODEL',
          correctLabel: 'Display the four quadrants',
          explanation: 'Prints the confusion matrix in a readable 2x2 format.',
          deepDive: 'Laying out TN, FP, FN, TP in a grid makes it easy to see where the model succeeds and fails. Ideally TN and TP are large while FP and FN are small.',
          deeperDive: 'The 2x2 layout shows: top-left (TN) and bottom-right (TP) are correct predictions on the diagonal. top-right (FP) are false alarms -- the model predicted "buy" when the customer did not. bottom-left (FN) are missed buyers -- the model predicted "no buy" when they actually bought. In marketing, FN means lost revenue (missing a potential buyer) while FP means wasted ad spend (targeting someone who will not buy). The business context determines which error is more costly.',
          options: ['Display the four quadrants', 'Compute the matrix', 'Calculate accuracy', 'Import confusion matrix'],
        },
        {
          startLine: 8,
          endLine: 9,
          color: 'XRAY_PREDICT',
          correctLabel: 'Calculate accuracy',
          explanation: 'Accuracy is the fraction of all predictions that were correct: (TP + TN) / total.',
          deepDive: 'Accuracy counts how often the model is right overall. But be careful -- if 90% of people did not buy, predicting "no buy" for everyone gives 90% accuracy without being useful.',
          deeperDive: 'Accuracy = (TP + TN) / (TP + TN + FP + FN) is the simplest metric but can be misleading with imbalanced classes. If only 10% of customers buy, a model that always predicts "no buy" gets 90% accuracy but catches zero buyers. The :.2% format specifier multiplies by 100 and adds a percent sign, so 0.85 displays as "85.00%". For imbalanced problems, you should also look at precision (of those predicted as buyers, how many actually bought?), recall (of actual buyers, how many did we catch?), and F1-score (harmonic mean of precision and recall).',
          options: ['Calculate accuracy', 'Display the four quadrants', 'Compute the matrix', 'Import confusion matrix'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'from sklearn.metrics import confusion_matrix',
          lines: [0],
        },
        {
          id: 'compute',
          code: 'cm = confusion_matrix(y, y_pred)\ntn, fp, fn, tp = cm.ravel()',
          lines: [2, 3],
        },
        {
          id: 'display',
          code: 'print(f"TN={tn}  FP={fp}")\nprint(f"FN={fn}  TP={tp}")',
          lines: [5, 6],
        },
        {
          id: 'accuracy',
          code: 'accuracy = (tp + tn) / (tp + tn + fp + fn)\nprint(f"Accuracy: {accuracy:.2%}")',
          lines: [8, 9],
        },
      ],
    },

    rewire: {
      goal: 'Calculate the error rate instead of accuracy',
      targets: [
        {
          line: 8,
          description: 'Change the formula',
          currentCode: 'accuracy = (tp + tn) / (tp + tn + fp + fn)',
          options: [
            { label: '(fp + fn) / (tp + tn + fp + fn)', newCode: 'accuracy = (fp + fn) / (tp + tn + fp + fn)', correct: true },
            { label: '(tp + fp) / (tp + tn + fp + fn)', newCode: 'accuracy = (tp + fp) / (tp + tn + fp + fn)', correct: false },
            { label: '(tp) / (tp + fn)', newCode: 'accuracy = (tp) / (tp + fn)', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 6: Precision & Recall
  {
    id: 'precision_recall',
    name: 'Precision & Recall',
    chapter: 1,
    description: 'Measure precision, recall, and F1-score.',
    tracer: [
      { text: 'Precision: of predicted buyers, how many actually bought?', viz: 'pr_precision' },
      { text: 'Recall: of actual buyers, how many did we catch?', viz: 'pr_recall' },
      { text: 'F1 balances both into one number.', viz: 'pr_f1' },
    ],
    code: [
      'from sklearn.metrics import classification_report',
      '',
      'report = classification_report(y, y_pred)',
      'print(report)',
      '',
      'from sklearn.metrics import accuracy_score',
      'acc = accuracy_score(y, y_pred)',
      'print(f"Overall accuracy: {acc:.2%}")',
    ],

    xray: {
      pipeline: ['import', 'report', 'accuracy'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import classification report',
          explanation: 'classification_report produces a full precision/recall/F1 table.',
          deepDive: 'classification_report is a one-stop summary. It calculates precision, recall, and F1 for each class plus overall averages, all in one neat table.',
          deeperDive: 'classification_report(y_true, y_pred) returns a formatted string table with rows for each class (0 and 1), plus "accuracy", "macro avg" (unweighted mean across classes), and "weighted avg" (weighted by class support). Columns are precision, recall, f1-score, and support (number of samples in each class). Precision = TP / (TP + FP): how reliable are positive predictions? Recall = TP / (TP + FN): what fraction of positives are found? F1 = 2 * (precision * recall) / (precision + recall): harmonic mean, balanced summary.',
          options: ['Import classification report', 'Generate the report', 'Calculate overall accuracy', 'Import accuracy score'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_MODEL',
          correctLabel: 'Generate and print the report',
          explanation: 'Produces a table with precision, recall, F1-score, and support for each class.',
          deepDive: 'The report shows two rows: class 0 (did not buy) and class 1 (bought). High precision for class 1 means few false alarms. High recall for class 1 means few missed buyers.',
          deeperDive: 'A typical report might look like: class 0 -- precision 0.88, recall 0.92, f1 0.90; class 1 -- precision 0.82, recall 0.75, f1 0.78. This tells you the model is better at identifying non-buyers than buyers, which is common when the classes are imbalanced. The "support" column shows sample counts -- if class 1 has much less support, its metrics are less reliable. Macro avg treats both classes equally, while weighted avg accounts for class sizes. For business decisions, focus on class 1 metrics since those drive marketing actions.',
          options: ['Generate and print the report', 'Import classification report', 'Calculate overall accuracy', 'Import accuracy score'],
        },
        {
          startLine: 5,
          endLine: 7,
          color: 'XRAY_PREDICT',
          correctLabel: 'Calculate overall accuracy',
          explanation: 'accuracy_score is a convenient function that computes (correct / total).',
          deepDive: 'accuracy_score is a quick way to get the overall correct rate. It gives the same number as (TP + TN) / total but in a single function call.',
          deeperDive: 'accuracy_score(y, y_pred) computes the fraction of correct predictions. It is equivalent to np.mean(y == y_pred). While accuracy is intuitive, it can be misleading -- a model that always predicts the majority class achieves high accuracy on imbalanced data. For the BeatBox dataset, if 65% did not buy, a "predict all 0" model gets 65% accuracy. That is why the classification_report is more informative: it shows per-class performance, revealing whether the model actually learned to identify buyers or is just riding the majority class.',
          options: ['Calculate overall accuracy', 'Generate the report', 'Import classification report', 'Fit the model'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import_report',
          code: 'from sklearn.metrics import classification_report',
          lines: [0],
        },
        {
          id: 'report',
          code: 'report = classification_report(y, y_pred)\nprint(report)',
          lines: [2, 3],
        },
        {
          id: 'accuracy',
          code: 'from sklearn.metrics import accuracy_score\nacc = accuracy_score(y, y_pred)\nprint(f"Overall accuracy: {acc:.2%}")',
          lines: [5, 6, 7],
        },
      ],
    },

    rewire: {
      goal: 'Show the report as a dictionary instead of a string',
      targets: [
        {
          line: 2,
          description: 'Change the output format',
          currentCode: 'report = classification_report(y, y_pred)',
          options: [
            { label: 'classification_report(y, y_pred, output_dict=True)', newCode: 'report = classification_report(y, y_pred, output_dict=True)', correct: true },
            { label: 'classification_report(y, y_pred, digits=4)', newCode: 'report = classification_report(y, y_pred, digits=4)', correct: false },
            { label: 'classification_report(y, y_pred, zero_division=0)', newCode: 'report = classification_report(y, y_pred, zero_division=0)', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 3: Advanced Evaluation
  // ================================================================

  // LESSON 7: ROC Curve & AUC
  {
    id: 'roc_curve_auc',
    name: 'ROC Curve & AUC',
    chapter: 2,
    description: 'Evaluate the model across all thresholds with ROC and AUC.',
    tracer: [
      { text: 'Each threshold gives a different FPR/TPR pair.', viz: 'roc_thresholds' },
      { text: 'Plot them all to get the ROC curve.', viz: 'roc_curve' },
      { text: 'AUC measures the area under the curve (1.0 = perfect).', viz: 'roc_auc' },
    ],
    code: [
      'from sklearn.metrics import roc_curve, auc',
      '',
      'fpr, tpr, thresholds = roc_curve(y, p_buy)',
      'roc_auc = auc(fpr, tpr)',
      '',
      'print(f"AUC: {roc_auc:.3f}")',
      '',
      'plt.plot(fpr, tpr, label=f"AUC = {roc_auc:.3f}")',
      'plt.plot([0, 1], [0, 1], "k--", label="Random")',
      'plt.xlabel("False Positive Rate")',
      'plt.ylabel("True Positive Rate")',
      'plt.legend()',
      'plt.show()',
    ],

    xray: {
      pipeline: ['import', 'compute\nROC', 'AUC', 'plot'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import ROC tools',
          explanation: 'roc_curve computes the curve points. auc calculates the area under it.',
          deepDive: 'roc_curve sweeps through all possible thresholds and records the false positive rate and true positive rate at each one. auc then measures the total area under that curve.',
          deeperDive: 'roc_curve(y_true, y_scores) takes the true labels and continuous prediction scores (probabilities, not hard labels). It returns three arrays: fpr (false positive rates), tpr (true positive rates), and thresholds (the threshold values at each point). The function automatically tries many thresholds from high to low, computing FPR = FP / (FP + TN) and TPR = TP / (TP + FN) at each. auc(fpr, tpr) uses the trapezoidal rule to compute the area under the resulting curve. An AUC of 1.0 means perfect separation; 0.5 means no better than random guessing.',
          options: ['Import ROC tools', 'Compute the ROC curve', 'Calculate AUC', 'Plot the curve'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Compute ROC curve and AUC',
          explanation: 'roc_curve returns FPR, TPR, and threshold arrays. auc calculates the area.',
          deepDive: 'roc_curve tries every possible cutoff and measures two things at each: how many non-buyers you accidentally catch (FPR) and how many actual buyers you find (TPR). AUC summarizes the whole curve into one number.',
          deeperDive: 'Note that roc_curve takes p_buy (continuous probabilities), not y_pred (hard labels). This is important -- ROC analysis evaluates the model\'s ranking ability across all thresholds, not just one. The returned arrays might have hundreds of points. FPR ranges from 0 to 1, TPR ranges from 0 to 1, and thresholds are sorted in decreasing order. A high AUC (e.g., 0.85) means that a randomly chosen buyer is ranked higher than a randomly chosen non-buyer 85% of the time. AUC is threshold-independent, making it useful for comparing models without committing to a specific cutoff.',
          options: ['Compute ROC curve and AUC', 'Import ROC tools', 'Plot the curve', 'Print the AUC'],
        },
        {
          startLine: 5,
          endLine: 5,
          color: 'XRAY_MODEL',
          correctLabel: 'Print the AUC score',
          explanation: 'AUC ranges from 0.5 (random) to 1.0 (perfect). Higher is better.',
          deepDive: 'An AUC of 0.5 means the model is no better than flipping a coin. An AUC of 0.8+ is considered good. The :.3f format shows three decimal places.',
          deeperDive: 'AUC interpretation guidelines: 0.5 = random guessing (the diagonal line), 0.5-0.6 = poor, 0.6-0.7 = fair, 0.7-0.8 = acceptable, 0.8-0.9 = excellent, 0.9-1.0 = outstanding. For marketing applications like the BeatBox case, an AUC of 0.75-0.85 is typical and useful. The :.3f format shows the number with 3 decimal places. AUC is especially valuable when comparing models because it is invariant to class imbalance and threshold choice -- a model with AUC 0.85 is definitively better than one with AUC 0.78, regardless of what threshold you end up using.',
          options: ['Print the AUC score', 'Compute ROC curve', 'Import ROC tools', 'Plot the curve'],
        },
        {
          startLine: 7,
          endLine: 12,
          color: 'XRAY_PREDICT',
          correctLabel: 'Plot the ROC curve',
          explanation: 'Plots FPR vs TPR with a diagonal reference line for random guessing.',
          deepDive: 'The blue curve shows your model. The dashed diagonal is what random guessing looks like. The farther your curve bows toward the top-left corner, the better the model.',
          deeperDive: 'plt.plot(fpr, tpr) draws the ROC curve. The dashed line plt.plot([0, 1], [0, 1], "k--") is the baseline for a random classifier (AUC = 0.5). A perfect classifier would go straight up to (0, 1) then right to (1, 1), forming a right angle in the top-left corner. The "elbow" of a real ROC curve shows where increasing TPR starts costing a lot of FPR -- this is often the optimal operating point. In the BeatBox context, the top-left region represents thresholds where you catch many buyers (high TPR) without wasting too much budget on non-buyers (low FPR).',
          options: ['Plot the ROC curve', 'Print the AUC score', 'Compute ROC curve', 'Import ROC tools'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'from sklearn.metrics import roc_curve, auc',
          lines: [0],
        },
        {
          id: 'compute',
          code: 'fpr, tpr, thresholds = roc_curve(y, p_buy)\nroc_auc = auc(fpr, tpr)',
          lines: [2, 3],
        },
        {
          id: 'print_auc',
          code: 'print(f"AUC: {roc_auc:.3f}")',
          lines: [5],
        },
        {
          id: 'plot',
          code: 'plt.plot(fpr, tpr, label=f"AUC = {roc_auc:.3f}")\nplt.plot([0, 1], [0, 1], "k--", label="Random")\nplt.xlabel("False Positive Rate")\nplt.ylabel("True Positive Rate")\nplt.legend()\nplt.show()',
          lines: [7, 8, 9, 10, 11, 12],
        },
      ],
    },

    rewire: {
      goal: 'Add a title to the ROC plot',
      targets: [
        {
          line: 11,
          description: 'Add a title before legend',
          currentCode: 'plt.legend()',
          options: [
            { label: 'plt.title("ROC Curve")', newCode: 'plt.title("ROC Curve")', correct: true },
            { label: 'plt.suptitle("ROC")', newCode: 'plt.suptitle("ROC")', correct: false },
            { label: 'plt.label("ROC Curve")', newCode: 'plt.label("ROC Curve")', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 8: Feature Importance
  {
    id: 'feature_importance',
    name: 'Feature Importance',
    chapter: 2,
    description: 'Identify which features matter most for buying decisions.',
    tracer: [
      { text: 'Each feature has a coefficient (weight).', viz: 'feat_coefs' },
      { text: 'Larger absolute value = stronger influence.', viz: 'feat_bars' },
      { text: 'The most important feature drives the prediction most.', viz: 'feat_top' },
    ],
    code: [
      'import numpy as np',
      '',
      'features = ["age", "income", "ad_exposure"]',
      'coefs = model.coef_[0]',
      '',
      'for name, c in zip(features, coefs):',
      '    print(f"{name:15s} {c:+.4f}")',
      '',
      'top_idx = np.argmax(np.abs(coefs))',
      'print(f"Most important: {features[top_idx]}")',
    ],

    xray: {
      pipeline: ['import', 'extract\ncoefs', 'print\neach', 'find\ntop'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import numpy',
          explanation: 'numpy provides argmax and abs for finding the most important feature.',
          deepDive: 'We need numpy for two operations: taking the absolute value of coefficients and finding the index of the largest one with argmax.',
          deeperDive: 'numpy (Numerical Python) is the foundational array library for scientific computing in Python. Here we use np.abs() to get absolute values (since a coefficient of -0.5 is equally important as +0.5, just in the opposite direction) and np.argmax() to find the index of the maximum value. These are vectorized operations that work on entire arrays at once, much faster than Python loops. numpy is already a dependency of sklearn and pandas, so importing it adds no extra overhead.',
          options: ['Import numpy', 'Extract coefficients', 'Print feature weights', 'Find most important feature'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Set up feature names and coefficients',
          explanation: 'List the feature names and extract the learned coefficients from the model.',
          deepDive: 'features lists the column names in the same order they were passed to the model. coefs extracts the learned weights. model.coef_[0] grabs the first (and only) row since this is binary classification.',
          deeperDive: 'model.coef_ has shape (1, n_features) for binary classification -- the [0] index extracts the 1D array of coefficients. The order matches the column order in X, so coefs[0] corresponds to "age", coefs[1] to "income", and coefs[2] to "ad_exposure". Each coefficient represents the change in log-odds per one-unit increase in that feature, holding all other features constant. For example, if the ad_exposure coefficient is 0.45, each additional ad view increases the log-odds of buying by 0.45, which corresponds to a multiplicative increase of exp(0.45) = 1.57 in the odds ratio.',
          options: ['Set up feature names and coefficients', 'Import numpy', 'Print feature weights', 'Find most important feature'],
        },
        {
          startLine: 5,
          endLine: 6,
          color: 'XRAY_MODEL',
          correctLabel: 'Print each feature weight',
          explanation: 'Loop through features and coefficients together using zip. The +/- sign shows direction.',
          deepDive: 'zip pairs each feature name with its coefficient. The format {c:+.4f} shows the sign explicitly -- positive means the feature increases buying probability, negative means it decreases it.',
          deeperDive: 'The format specification {name:15s} left-aligns the string in a 15-character field for neat columns. {c:+.4f} uses the "+" flag to always show the sign (both + and -) and ".4f" for 4 decimal places. zip(features, coefs) creates pairs like ("age", 0.0312), ("income", 0.0001), ("ad_exposure", 0.4521). Positive coefficients mean the feature increases purchase probability. Negative ones decrease it. However, the raw coefficient magnitude depends on the feature\'s scale -- a coefficient of 0.0001 for income (measured in thousands) might be as impactful as 0.03 for age (measured in years).',
          options: ['Print each feature weight', 'Set up names and coefficients', 'Import numpy', 'Find most important feature'],
        },
        {
          startLine: 8,
          endLine: 9,
          color: 'XRAY_PREDICT',
          correctLabel: 'Find the most important feature',
          explanation: 'argmax(abs(coefs)) finds the feature with the largest absolute coefficient.',
          deepDive: 'Taking absolute values ensures we compare magnitude, not direction. A coefficient of -0.8 is more influential than +0.3, even though it is negative. argmax returns the index of the winner.',
          deeperDive: 'np.abs(coefs) converts all coefficients to their absolute values: [-0.5, 0.3, 0.8] becomes [0.5, 0.3, 0.8]. np.argmax() then returns the index of the maximum, which is 2 (ad_exposure in this case). This is a simple heuristic for feature importance in logistic regression. For more rigorous importance measures, you could use standardized coefficients (fit on scaled features so all are comparable), permutation importance (shuffle each feature and measure accuracy drop), or SHAP values (game-theoretic attribution). But coefficient magnitude is a great starting point for understanding your model.',
          options: ['Find the most important feature', 'Print each feature weight', 'Set up names and coefficients', 'Import numpy'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'import numpy as np',
          lines: [0],
        },
        {
          id: 'setup',
          code: 'features = ["age", "income", "ad_exposure"]\ncoefs = model.coef_[0]',
          lines: [2, 3],
        },
        {
          id: 'print_loop',
          code: 'for name, c in zip(features, coefs):\n    print(f"{name:15s} {c:+.4f}")',
          lines: [5, 6],
        },
        {
          id: 'top',
          code: 'top_idx = np.argmax(np.abs(coefs))\nprint(f"Most important: {features[top_idx]}")',
          lines: [8, 9],
        },
      ],
    },

    rewire: {
      goal: 'Sort features by importance (largest absolute coefficient first)',
      targets: [
        {
          line: 8,
          description: 'Change to argsort for ranking',
          currentCode: 'top_idx = np.argmax(np.abs(coefs))',
          options: [
            { label: 'np.argsort(np.abs(coefs))[::-1]', newCode: 'top_idx = np.argsort(np.abs(coefs))[::-1]', correct: true },
            { label: 'np.argsort(coefs)[::-1]', newCode: 'top_idx = np.argsort(coefs)[::-1]', correct: false },
            { label: 'np.argmin(np.abs(coefs))', newCode: 'top_idx = np.argmin(np.abs(coefs))', correct: false },
          ],
        },
      ],
    },
  },
];
