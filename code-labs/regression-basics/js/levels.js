// ============================================================
// LEVELS — 8 Lessons across 3 Chapters with X-Ray / Assemble / Rewire rounds
// ============================================================

export const LEVELS = [
  // ================================================================
  // CHAPTER 1: Explore Data
  // ================================================================

  // LESSON 1: Load & Inspect
  {
    id: 'load_and_inspect',
    name: 'Load & Inspect',
    chapter: 0,
    description: 'Load a CSV and take your first look at the data.',
    tracer: [
      { text: 'pandas reads data from files.', viz: 'load_pandas' },
      { text: 'shape tells you rows and columns.', viz: 'load_shape' },
      { text: 'head() shows the first few rows.', viz: 'load_head' },
    ],
    code: [
      'import pandas as pd',
      '',
      "df = pd.read_csv('ad_spend.csv')",
      'print(df.shape)',
      'print(df.head())',
    ],

    xray: {
      pipeline: ['pandas', 'read_csv', 'inspect'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import library',
          explanation: 'pandas is the go-to library for working with tabular data in Python.',
          deepDive: 'pandas gives you DataFrames -- spreadsheet-like tables that live in Python. The "as pd" part is just a shortcut so you type less.',
          deeperDive: 'pandas is built on top of NumPy and provides two main data structures: Series (1D) and DataFrame (2D). A DataFrame is essentially a dictionary of Series that share the same index. When you import pandas as pd, you get access to hundreds of functions for reading files (read_csv, read_excel, read_json), manipulating data (merge, groupby, pivot_table), and computing statistics (describe, corr, value_counts). It handles missing values with NaN, supports datetime indexing, and can work with datasets that fit in memory -- typically up to a few GB.',
          options: ['Import library', 'Load the data', 'Inspect the data', 'Plot the data'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Load the data',
          explanation: 'read_csv reads a file into a DataFrame. shape returns (rows, columns).',
          deepDive: 'read_csv turns a comma-separated file into a table you can work with. shape is like checking the dimensions of a spreadsheet -- "200 rows by 2 columns" for example.',
          deeperDive: 'pd.read_csv() is the most commonly used pandas function. It auto-detects column types, handles headers, and can parse dates. The shape attribute returns a tuple like (200, 2), meaning 200 observations and 2 variables. Common parameters include sep="," (delimiter), header=0 (which row is the header), index_col=None (which column to use as index), and na_values=["", "NA"] (what counts as missing). For large files, you can use chunksize=1000 to process in pieces or dtype={"col": "float32"} to reduce memory usage.',
          options: ['Load the data', 'Import library', 'Inspect the data', 'Clean the data'],
        },
        {
          startLine: 4,
          endLine: 4,
          color: 'XRAY_PREDICT',
          correctLabel: 'Inspect the data',
          explanation: 'head() shows the first 5 rows so you can see what the data looks like.',
          deepDive: 'head() is like peeking at the top of a spreadsheet. It shows the first 5 rows by default, giving you a quick sense of what columns exist and what the values look like.',
          deeperDive: 'head(n) returns the first n rows as a new DataFrame. The default is 5. Its counterpart tail(n) shows the last n rows. Other useful inspection methods include info() which shows column types and non-null counts, describe() which computes summary statistics (mean, std, min, max, quartiles), and dtypes which shows the data type of each column. Always inspect your data before analysis to catch issues like wrong types (numbers stored as strings), unexpected missing values, or columns that need renaming.',
          options: ['Inspect the data', 'Load the data', 'Import library', 'Transform the data'],
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
          code: "df = pd.read_csv('ad_spend.csv')\nprint(df.shape)",
          lines: [2, 3],
        },
        {
          id: 'inspect',
          code: 'print(df.head())',
          lines: [4],
        },
      ],
    },

    rewire: {
      goal: "Load 'sales.csv' instead and show the last rows",
      targets: [
        {
          line: 2,
          description: 'Change the file name',
          currentCode: "df = pd.read_csv('ad_spend.csv')",
          options: [
            { label: "read_csv('sales.csv')", newCode: "df = pd.read_csv('sales.csv')", correct: true },
            { label: "read_csv('data.csv')", newCode: "df = pd.read_csv('data.csv')", correct: false },
            { label: "read_excel('sales.xlsx')", newCode: "df = pd.read_excel('sales.xlsx')", correct: false },
          ],
        },
        {
          line: 4,
          description: 'Show the last rows instead of first',
          currentCode: 'print(df.head())',
          options: [
            { label: 'df.tail()', newCode: 'print(df.tail())', correct: true },
            { label: 'df.head(10)', newCode: 'print(df.head(10))', correct: false },
            { label: 'df.sample()', newCode: 'print(df.sample())', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 2: Scatter Plot
  {
    id: 'scatter_plot',
    name: 'Scatter Plot',
    chapter: 0,
    description: 'Visualize the relationship between two variables.',
    tracer: [
      { text: 'matplotlib draws charts and graphs.', viz: 'scatter_lib' },
      { text: 'Each dot is one observation.', viz: 'scatter_dots' },
      { text: 'Labels tell the reader what they see.', viz: 'scatter_labels' },
    ],
    code: [
      'import matplotlib.pyplot as plt',
      '',
      "plt.scatter(df['spend'], df['sales'])",
      "plt.xlabel('Ad Spend ($)')",
      "plt.ylabel('Sales ($)')",
      "plt.title('Ad Spend vs Sales')",
      'plt.show()',
    ],

    xray: {
      pipeline: ['pyplot', 'scatter', 'labels'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import plotting',
          explanation: 'matplotlib.pyplot is the standard plotting library. "plt" is the conventional alias.',
          deepDive: 'pyplot is a collection of functions that make matplotlib work like MATLAB. You call plt.scatter(), plt.plot(), plt.bar(), etc. to create different chart types.',
          deeperDive: 'matplotlib is the foundational plotting library in Python, and pyplot is its state-based interface. When you call plt.scatter(), it creates or modifies the "current figure" behind the scenes. For simple plots this is convenient, but for complex multi-panel figures you might use the object-oriented interface: fig, ax = plt.subplots(). Other popular plotting libraries like seaborn and plotly are built on top of or inspired by matplotlib. The "as plt" alias is used by virtually every Python data scientist.',
          options: ['Import plotting', 'Create scatter plot', 'Label the axes', 'Show the chart'],
        },
        {
          startLine: 2,
          endLine: 2,
          color: 'XRAY_DATA',
          correctLabel: 'Create scatter plot',
          explanation: "scatter() places a dot for each pair of (spend, sales) values.",
          deepDive: 'Each dot represents one row in the data. The x-position is the ad spend value, and the y-position is the sales value. You can immediately see if there is a pattern.',
          deeperDive: "plt.scatter(x, y) takes two arrays of equal length and plots each (x[i], y[i]) pair as a point. You can customize with parameters like c='red' for color, s=50 for size, alpha=0.5 for transparency, and marker='o' for shape. df['spend'] uses bracket notation to select a column from the DataFrame, returning a pandas Series. This is equivalent to df.spend but bracket notation works with column names that contain spaces or special characters.",
          options: ['Create scatter plot', 'Import plotting', 'Label the axes', 'Fit a line'],
        },
        {
          startLine: 3,
          endLine: 5,
          color: 'XRAY_PREDICT',
          correctLabel: 'Label the axes',
          explanation: 'xlabel, ylabel, and title add text so the chart is easy to understand.',
          deepDive: 'A chart without labels is like a map without street names. Always label your axes and add a title so anyone can understand what they are looking at.',
          deeperDive: 'Professional data visualizations follow a standard: the x-axis label describes the independent variable (what you control or observe), the y-axis label describes the dependent variable (what you measure), and the title summarizes the relationship. You can also add plt.legend() for multiple data series, plt.grid(True) for reference lines, and plt.tight_layout() to prevent labels from being cut off. In publications and reports, clear labeling is what separates a useful chart from a confusing one.',
          options: ['Label the axes', 'Create scatter plot', 'Import plotting', 'Save the plot'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'import matplotlib.pyplot as plt',
          lines: [0],
        },
        {
          id: 'scatter',
          code: "plt.scatter(df['spend'], df['sales'])",
          lines: [2],
        },
        {
          id: 'labels',
          code: "plt.xlabel('Ad Spend ($)')\nplt.ylabel('Sales ($)')\nplt.title('Ad Spend vs Sales')",
          lines: [3, 4, 5],
        },
        {
          id: 'show',
          code: 'plt.show()',
          lines: [6],
        },
      ],
    },

    rewire: {
      goal: 'Change axis labels and title to reflect a different dataset',
      targets: [
        {
          line: 3,
          description: 'Change the x-axis label',
          currentCode: "plt.xlabel('Ad Spend ($)')",
          options: [
            { label: "xlabel('Price ($)')", newCode: "plt.xlabel('Price ($)')", correct: true },
            { label: "xlabel('Ad Spend')", newCode: "plt.xlabel('Ad Spend')", correct: false },
            { label: "ylabel('Price ($)')", newCode: "plt.ylabel('Price ($)')", correct: false },
          ],
        },
        {
          line: 5,
          description: 'Update the title',
          currentCode: "plt.title('Ad Spend vs Sales')",
          options: [
            { label: "title('Price vs Revenue')", newCode: "plt.title('Price vs Revenue')", correct: true },
            { label: "title('Ad Spend vs Sales')", newCode: "plt.title('Ad Spend vs Sales')", correct: false },
            { label: "suptitle('Price vs Revenue')", newCode: "plt.suptitle('Price vs Revenue')", correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 3: Correlation
  {
    id: 'correlation',
    name: 'Correlation',
    chapter: 0,
    description: 'Measure the strength of a linear relationship.',
    tracer: [
      { text: 'NumPy does fast numerical computation.', viz: 'corr_numpy' },
      { text: 'Correlation ranges from -1 to +1.', viz: 'corr_range' },
      { text: 'describe() shows summary statistics.', viz: 'corr_describe' },
    ],
    code: [
      'import numpy as np',
      '',
      "corr = np.corrcoef(df['spend'], df['sales'])",
      "print(f'Correlation: {corr[0, 1]:.3f}')",
      '',
      "print(df[['spend', 'sales']].describe())",
    ],

    xray: {
      pipeline: ['numpy', 'corrcoef', 'describe'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import numpy',
          explanation: 'NumPy is the foundation for numerical computing in Python.',
          deepDive: 'NumPy provides fast arrays and math functions. Nearly every data science library in Python (pandas, scikit-learn, matplotlib) is built on top of it.',
          deeperDive: 'NumPy stands for Numerical Python. Its core data structure is the ndarray (n-dimensional array), which stores numbers in contiguous memory for fast computation. Operations like addition, multiplication, and statistical functions run 10-100x faster on NumPy arrays than on Python lists because they use optimized C code under the hood. When you do np.corrcoef(), NumPy computes the Pearson correlation matrix using vectorized operations rather than Python loops.',
          options: ['Import numpy', 'Compute correlation', 'Summarize data', 'Plot the data'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Compute correlation',
          explanation: 'corrcoef returns a correlation matrix. [0,1] extracts the correlation between the two variables.',
          deepDive: 'The correlation coefficient tells you how tightly two variables move together. +1 means perfect positive relationship, -1 means perfect negative, and 0 means no linear relationship at all.',
          deeperDive: 'np.corrcoef(x, y) returns a 2x2 matrix where [0,0] and [1,1] are always 1.0 (each variable perfectly correlates with itself) and [0,1] = [1,0] is the Pearson correlation between x and y. The Pearson r measures the strength and direction of the linear relationship: r = cov(x,y) / (std(x) * std(y)). A value of 0.85 means a strong positive linear relationship -- as ad spend goes up, sales tend to go up proportionally. The :.3f format specifier displays the number with 3 decimal places.',
          options: ['Compute correlation', 'Import numpy', 'Summarize data', 'Fit a model'],
        },
        {
          startLine: 5,
          endLine: 5,
          color: 'XRAY_PREDICT',
          correctLabel: 'Summarize data',
          explanation: 'describe() shows count, mean, std, min, max, and quartiles for selected columns.',
          deepDive: 'Like a report card for your data. It shows the average, spread, and range all at once so you can spot anything unusual before modeling.',
          deeperDive: 'describe() computes 8 summary statistics: count (non-null values), mean, std (standard deviation), min, 25% (first quartile), 50% (median), 75% (third quartile), and max. The double brackets df[["spend", "sales"]] select multiple columns, returning a DataFrame rather than a Series. Checking these stats helps you catch data quality issues: if min is negative for a variable that should always be positive, or if std is 0 meaning there is no variation, you know something is wrong before you start modeling.',
          options: ['Summarize data', 'Compute correlation', 'Import numpy', 'Clean the data'],
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
          id: 'corr',
          code: "corr = np.corrcoef(df['spend'], df['sales'])\nprint(f'Correlation: {corr[0, 1]:.3f}')",
          lines: [2, 3],
        },
        {
          id: 'describe',
          code: "print(df[['spend', 'sales']].describe())",
          lines: [5],
        },
      ],
    },

    rewire: {
      goal: 'Compute correlation of price and revenue columns instead',
      targets: [
        {
          line: 2,
          description: 'Change the columns',
          currentCode: "corr = np.corrcoef(df['spend'], df['sales'])",
          options: [
            { label: "df['price'], df['revenue']", newCode: "corr = np.corrcoef(df['price'], df['revenue'])", correct: true },
            { label: "df['spend'], df['revenue']", newCode: "corr = np.corrcoef(df['spend'], df['revenue'])", correct: false },
            { label: "df['price'], df['sales']", newCode: "corr = np.corrcoef(df['price'], df['sales'])", correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 2: Fit a Model
  // ================================================================

  // LESSON 4: Fit a Line
  {
    id: 'fit_a_line',
    name: 'Fit a Line',
    chapter: 1,
    description: 'Use scikit-learn to fit a linear regression model.',
    tracer: [
      { text: 'scikit-learn has ready-made models.', viz: 'fit_sklearn' },
      { text: 'X must be 2D (rows x columns).', viz: 'fit_reshape' },
      { text: 'fit() finds the best line through the data.', viz: 'fit_bestline' },
    ],
    code: [
      'from sklearn.linear_model import LinearRegression',
      '',
      "X = df[['spend']]",
      "y = df['sales']",
      '',
      'model = LinearRegression()',
      'model.fit(X, y)',
    ],

    xray: {
      pipeline: ['sklearn', 'X, y', 'fit'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import model',
          explanation: 'LinearRegression is a class from scikit-learn that fits a straight line to data.',
          deepDive: 'scikit-learn (sklearn) is the most popular machine learning library in Python. LinearRegression is its simplest model -- it finds the best straight line through your data points.',
          deeperDive: 'scikit-learn organizes models as classes with a consistent API: you create an instance (model = LinearRegression()), then call model.fit(X, y) to train, and model.predict(X_new) to make predictions. The from ... import syntax loads just the one class you need rather than the entire library. LinearRegression uses Ordinary Least Squares (OLS), which minimizes the sum of squared differences between predicted and actual y values. Other models like Ridge and Lasso add regularization to prevent overfitting.',
          options: ['Import model', 'Prepare data', 'Fit the model', 'Make predictions'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Prepare data',
          explanation: 'X is the feature (2D array). y is the target (1D array). scikit-learn requires this format.',
          deepDive: 'X uses double brackets [[]] to keep it as a 2D table (even with one column), because scikit-learn expects rows-and-columns format. y is just a flat list of target values.',
          deeperDive: 'The double brackets df[["spend"]] return a DataFrame with shape (n, 1), while single brackets df["spend"] return a Series with shape (n,). scikit-learn requires X to be 2D because it is designed to handle multiple features -- even if you only have one. The convention X (uppercase) for features and y (lowercase) for the target comes from the mathematical notation y = Xb + e, where X is the design matrix, b is the coefficient vector, and e is the error term. This separation is fundamental to supervised learning.',
          options: ['Prepare data', 'Import model', 'Fit the model', 'Evaluate the model'],
        },
        {
          startLine: 5,
          endLine: 6,
          color: 'XRAY_MODEL',
          correctLabel: 'Fit the model',
          explanation: 'LinearRegression() creates the model. fit() calculates the best slope and intercept.',
          deepDive: 'Creating the model is like buying a ruler. Calling fit() is like placing that ruler on the scatter plot at the angle that gets closest to all the points at once.',
          deeperDive: 'model.fit(X, y) solves the normal equations (X^T X)^{-1} X^T y to find the optimal coefficients. After fitting, the model stores: model.coef_ (the slope -- one value per feature) and model.intercept_ (the y-intercept). The underscore suffix is a scikit-learn convention indicating that these attributes only exist after fitting. Internally, LinearRegression uses numpy.linalg.lstsq for numerical stability. The fit is deterministic -- given the same data, you always get the same coefficients, unlike iterative methods that depend on random initialization.',
          options: ['Fit the model', 'Import model', 'Prepare data', 'Plot the line'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'from sklearn.linear_model import LinearRegression',
          lines: [0],
        },
        {
          id: 'data',
          code: "X = df[['spend']]\ny = df['sales']",
          lines: [2, 3],
        },
        {
          id: 'fit',
          code: 'model = LinearRegression()\nmodel.fit(X, y)',
          lines: [5, 6],
        },
      ],
    },

    rewire: {
      goal: 'Use a different X variable (price instead of spend)',
      targets: [
        {
          line: 2,
          description: 'Change the feature column',
          currentCode: "X = df[['spend']]",
          options: [
            { label: "df[['price']]", newCode: "X = df[['price']]", correct: true },
            { label: "df['price']", newCode: "X = df['price']", correct: false },
            { label: "df[['spend', 'price']]", newCode: "X = df[['spend', 'price']]", correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 5: Slope & Intercept
  {
    id: 'slope_and_intercept',
    name: 'Slope & Intercept',
    chapter: 1,
    description: 'Extract and interpret the model coefficients.',
    tracer: [
      { text: 'The slope tells you the rate of change.', viz: 'slope_concept' },
      { text: 'The intercept is where the line crosses y=0.', viz: 'slope_intercept' },
      { text: 'Together they tell the business story.', viz: 'slope_story' },
    ],
    code: [
      'slope = model.coef_[0]',
      'intercept = model.intercept_',
      '',
      "print(f'Slope: {slope:.2f}')",
      "print(f'Intercept: {intercept:.2f}')",
      "print(f'For each $1 more spend, sales increase by ${slope:.2f}')",
    ],

    xray: {
      pipeline: ['coef_', 'intercept_', 'interpret'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_DATA',
          correctLabel: 'Extract coefficients',
          explanation: 'coef_[0] is the slope. intercept_ is the y-intercept. Both are set by fit().',
          deepDive: 'After fitting, the model stores the best slope and intercept. coef_ is an array (one value per feature), so [0] grabs the first. intercept_ is a single number.',
          deeperDive: 'model.coef_ returns a NumPy array of shape (n_features,). For simple linear regression with one feature, coef_[0] is the single slope value. For multiple regression with features [spend, clicks], coef_ would be an array like [2.5, 0.8], meaning each dollar of spend adds $2.50 to sales and each click adds $0.80. model.intercept_ is a scalar representing the predicted y value when all features are zero. The trailing underscore is a scikit-learn convention indicating these are "fitted" attributes that only exist after calling fit().',
          options: ['Extract coefficients', 'Print results', 'Business interpretation', 'Fit the model'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_MODEL',
          correctLabel: 'Print results',
          explanation: 'Print the slope and intercept with 2 decimal places.',
          deepDive: 'The f-string format :.2f means "show 2 decimal places." So a slope of 2.54321 displays as 2.54. This makes the output clean and easy to read.',
          deeperDive: 'Python f-strings (formatted string literals) were introduced in Python 3.6 and are the modern way to format output. The :.2f format specification means: fixed-point notation with 2 decimal places. Other useful formats include :.0f (no decimals), :.1% (percentage with 1 decimal), :,.0f (with thousands separator), and :>10 (right-aligned in 10 characters). For regression output, 2 decimal places is standard -- enough precision to be useful without overwhelming the reader with noise.',
          options: ['Print results', 'Extract coefficients', 'Business interpretation', 'Plot the line'],
        },
        {
          startLine: 5,
          endLine: 5,
          color: 'XRAY_PREDICT',
          correctLabel: 'Business interpretation',
          explanation: 'Translate the slope into a real-world statement: for each $1 more spend, sales go up by $slope.',
          deepDive: 'The slope is the "so what" of regression. Saying "the slope is 2.5" is math, but saying "each extra dollar of ad spend generates $2.50 in sales" is a business insight.',
          deeperDive: 'Interpreting coefficients in business terms is the most important skill in applied statistics. The slope represents the marginal effect: holding everything else constant, a one-unit increase in X is associated with a slope-unit increase in y. Note the word "associated" -- regression shows correlation, not necessarily causation. To claim causation, you need a controlled experiment or careful causal inference methods. Also, the intercept may not have a meaningful interpretation if X=0 is outside the range of your data (e.g., what are sales with $0 ad spend?).',
          options: ['Business interpretation', 'Extract coefficients', 'Print results', 'Compute R-squared'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'extract',
          code: 'slope = model.coef_[0]\nintercept = model.intercept_',
          lines: [0, 1],
        },
        {
          id: 'print',
          code: "print(f'Slope: {slope:.2f}')\nprint(f'Intercept: {intercept:.2f}')",
          lines: [3, 4],
        },
        {
          id: 'interpret',
          code: "print(f'For each $1 more spend, sales increase by ${slope:.2f}')",
          lines: [5],
        },
      ],
    },

    rewire: {
      goal: 'Show more decimal places in the output',
      targets: [
        {
          line: 3,
          description: 'Change the decimal format',
          currentCode: "print(f'Slope: {slope:.2f}')",
          options: [
            { label: '{slope:.4f}', newCode: "print(f'Slope: {slope:.4f}')", correct: true },
            { label: '{slope:.0f}', newCode: "print(f'Slope: {slope:.0f}')", correct: false },
            { label: '{slope}', newCode: "print(f'Slope: {slope}')", correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 6: R-Squared
  {
    id: 'r_squared',
    name: 'R-Squared',
    chapter: 1,
    description: 'Measure how well the model explains the data.',
    tracer: [
      { text: 'Predict y for each x in the data.', viz: 'r2_predict' },
      { text: 'R\u00B2 compares predictions to the actual values.', viz: 'r2_compare' },
      { text: 'R\u00B2 = 1 means a perfect fit.', viz: 'r2_perfect' },
    ],
    code: [
      'from sklearn.metrics import r2_score',
      '',
      'predicted = model.predict(X)',
      'r2 = r2_score(y, predicted)',
      '',
      "print(f'R-squared: {r2:.3f}')",
      "print(f'Model explains {r2*100:.1f}% of variation')",
    ],

    xray: {
      pipeline: ['metric', 'predict', 'R\u00B2'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import metric',
          explanation: 'r2_score is a function that calculates the R-squared (coefficient of determination).',
          deepDive: 'scikit-learn has many scoring functions in sklearn.metrics. r2_score measures how much of the variation in y is explained by the model.',
          deeperDive: 'sklearn.metrics contains functions for evaluating model performance: r2_score, mean_squared_error, mean_absolute_error, accuracy_score, f1_score, and many more. R-squared (R\u00B2) is defined as 1 - SS_res / SS_tot, where SS_res is the sum of squared residuals (prediction errors) and SS_tot is the total sum of squares (variance of y). An R\u00B2 of 0.85 means the model explains 85% of the variance in y, and the remaining 15% is unexplained noise or missing variables.',
          options: ['Import metric', 'Generate predictions', 'Calculate R\u00B2', 'Print results'],
        },
        {
          startLine: 2,
          endLine: 2,
          color: 'XRAY_DATA',
          correctLabel: 'Generate predictions',
          explanation: 'predict(X) runs each x-value through the model equation to get predicted y-values.',
          deepDive: 'The model applies y = slope * x + intercept for every row in X, giving you a predicted sales value for each observed ad spend.',
          deeperDive: 'model.predict(X) computes X @ model.coef_.T + model.intercept_ using matrix multiplication. The input X must have the same number of columns as the training data. The output is a 1D array of predicted values with the same number of elements as rows in X. You can predict on the training data (to evaluate fit) or on new data (to make forecasts). Predicting on training data shows how well the model fits, but predicting on held-out test data shows how well it generalizes.',
          options: ['Generate predictions', 'Import metric', 'Calculate R\u00B2', 'Fit the model'],
        },
        {
          startLine: 3,
          endLine: 6,
          color: 'XRAY_PREDICT',
          correctLabel: 'Calculate R\u00B2',
          explanation: 'r2_score compares actual vs predicted. Higher R\u00B2 = better fit (max 1.0).',
          deepDive: 'R\u00B2 = 0.85 means 85% of the ups and downs in sales are explained by ad spend. The remaining 15% is due to other factors not in the model.',
          deeperDive: 'R\u00B2 can be negative if the model is worse than simply predicting the mean of y for every observation. This happens with bad models or when evaluating on very different data. For simple linear regression, R\u00B2 equals the square of the Pearson correlation coefficient: r\u00B2 = corr(x, y)\u00B2. Common benchmarks: R\u00B2 > 0.9 is excellent, 0.7-0.9 is good, 0.5-0.7 is moderate, and < 0.5 is weak. However, a "good" R\u00B2 depends on the field -- in physics, 0.99 is expected; in social sciences, 0.3 can be meaningful.',
          options: ['Calculate R\u00B2', 'Generate predictions', 'Import metric', 'Plot residuals'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'from sklearn.metrics import r2_score',
          lines: [0],
        },
        {
          id: 'predict',
          code: 'predicted = model.predict(X)\nr2 = r2_score(y, predicted)',
          lines: [2, 3],
        },
        {
          id: 'print',
          code: "print(f'R-squared: {r2:.3f}')\nprint(f'Model explains {r2*100:.1f}% of variation')",
          lines: [5, 6],
        },
      ],
    },

    rewire: {
      goal: 'Compute mean squared error instead of R\u00B2',
      targets: [
        {
          line: 0,
          description: 'Import a different metric',
          currentCode: 'from sklearn.metrics import r2_score',
          options: [
            { label: 'mean_squared_error', newCode: 'from sklearn.metrics import mean_squared_error', correct: true },
            { label: 'accuracy_score', newCode: 'from sklearn.metrics import accuracy_score', correct: false },
            { label: 'r2_score, mean_squared_error', newCode: 'from sklearn.metrics import r2_score, mean_squared_error', correct: false },
          ],
        },
        {
          line: 3,
          description: 'Calculate MSE instead of R\u00B2',
          currentCode: 'r2 = r2_score(y, predicted)',
          options: [
            { label: 'mean_squared_error(y, predicted)', newCode: 'mse = mean_squared_error(y, predicted)', correct: true },
            { label: 'r2_score(predicted, y)', newCode: 'r2 = r2_score(predicted, y)', correct: false },
            { label: 'mean_squared_error(X, y)', newCode: 'mse = mean_squared_error(X, y)', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 3: Evaluate
  // ================================================================

  // LESSON 7: Residuals
  {
    id: 'residuals',
    name: 'Residuals',
    chapter: 2,
    description: 'Check the residual plot for model problems.',
    tracer: [
      { text: 'Residual = actual minus predicted.', viz: 'resid_concept' },
      { text: 'Good residuals look like random noise.', viz: 'resid_random' },
      { text: 'Patterns in residuals signal problems.', viz: 'resid_pattern' },
    ],
    code: [
      'residuals = y - predicted',
      '',
      'plt.scatter(predicted, residuals)',
      "plt.axhline(y=0, color='r', linestyle='--')",
      "plt.xlabel('Predicted')",
      "plt.ylabel('Residual')",
      "plt.title('Residual Plot')",
      'plt.show()',
    ],

    xray: {
      pipeline: ['residuals', 'scatter', 'ref line'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_DATA',
          correctLabel: 'Compute residuals',
          explanation: 'Subtract predicted from actual to get the error for each observation.',
          deepDive: 'A residual is how far off the prediction was. Positive means the model underestimated, negative means it overestimated. Ideally, residuals are small and random.',
          deeperDive: 'Residuals (e_i = y_i - y_hat_i) are the foundation of regression diagnostics. If the model is correct, residuals should be: (1) centered around zero (mean near 0), (2) have constant variance (homoscedasticity), (3) be normally distributed, and (4) be independent of each other. Violations of these assumptions suggest the model is missing something -- a nonlinear relationship, an omitted variable, or heteroscedastic errors. Residual analysis is the single most important diagnostic tool in regression.',
          options: ['Compute residuals', 'Create residual plot', 'Add reference line', 'Label the axes'],
        },
        {
          startLine: 2,
          endLine: 2,
          color: 'XRAY_MODEL',
          correctLabel: 'Create residual plot',
          explanation: 'Plot predicted values on x-axis vs residuals on y-axis to check for patterns.',
          deepDive: 'If the dots scatter randomly around zero, the model is doing well. If you see a curve or a funnel shape, the model might need improvement.',
          deeperDive: 'The residual plot is the standard diagnostic for linear regression. You plot predicted values (not X values) on the horizontal axis so the diagnostic works for multiple regression too. Common patterns to watch for: a U-shape means the relationship is nonlinear (try adding X\u00B2), a funnel shape means heteroscedasticity (try log-transforming y), and clusters suggest subgroups in the data. A "good" residual plot looks like a random cloud of points centered at zero with roughly constant vertical spread.',
          options: ['Create residual plot', 'Compute residuals', 'Add reference line', 'Fit a new model'],
        },
        {
          startLine: 3,
          endLine: 3,
          color: 'XRAY_PREDICT',
          correctLabel: 'Add reference line',
          explanation: 'axhline draws a horizontal line at y=0. Points above are under-predicted, below are over-predicted.',
          deepDive: 'The dashed red line at zero is the target. In a perfect model, all residuals would sit exactly on this line. In practice, we want them scattered randomly around it.',
          deeperDive: 'plt.axhline(y=0) draws a horizontal line spanning the full width of the plot. The parameters color="r" sets it to red, and linestyle="--" makes it dashed. This reference line makes it easy to visually assess the balance of positive and negative residuals. You can also add plt.axhline(y=std) and plt.axhline(y=-std) to show the standard deviation bands -- about 68% of residuals should fall within one standard deviation of zero if errors are normally distributed.',
          options: ['Add reference line', 'Create residual plot', 'Compute residuals', 'Save the plot'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'residuals',
          code: 'residuals = y - predicted',
          lines: [0],
        },
        {
          id: 'scatter',
          code: 'plt.scatter(predicted, residuals)',
          lines: [2],
        },
        {
          id: 'refline',
          code: "plt.axhline(y=0, color='r', linestyle='--')",
          lines: [3],
        },
        {
          id: 'labels',
          code: "plt.xlabel('Predicted')\nplt.ylabel('Residual')\nplt.title('Residual Plot')\nplt.show()",
          lines: [4, 5, 6, 7],
        },
      ],
    },

    rewire: {
      goal: 'Change the reference line color and style',
      targets: [
        {
          line: 3,
          description: 'Change the line style',
          currentCode: "plt.axhline(y=0, color='r', linestyle='--')",
          options: [
            { label: "color='blue', linestyle='-.'", newCode: "plt.axhline(y=0, color='blue', linestyle='-.')", correct: true },
            { label: "color='r', linestyle='-'", newCode: "plt.axhline(y=0, color='r', linestyle='-')", correct: false },
            { label: "color='g', linestyle='--'", newCode: "plt.axhline(y=0, color='g', linestyle='--')", correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 8: Make Predictions
  {
    id: 'make_predictions',
    name: 'Make Predictions',
    chapter: 2,
    description: 'Use the model to forecast sales for new ad spend values.',
    tracer: [
      { text: 'Define new input values.', viz: 'pred_input' },
      { text: 'The model applies the equation.', viz: 'pred_equation' },
      { text: 'Print the forecasts.', viz: 'pred_results' },
    ],
    code: [
      'new_spend = [[500], [1000], [1500]]',
      'predictions = model.predict(new_spend)',
      '',
      'for spend, pred in zip(new_spend, predictions):',
      "    print(f'Spend ${spend[0]} -> Sales ${pred:.2f}')",
    ],

    xray: {
      pipeline: ['new data', 'predict', 'display'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_DATA',
          correctLabel: 'Define new data',
          explanation: 'Create a list of new ad spend values to predict sales for. Each value is wrapped in a list to match the 2D format.',
          deepDive: 'Each value is inside its own list [[500], [1000], [1500]] because predict() expects 2D input -- rows and columns, just like the training data.',
          deeperDive: 'The nested list format [[500], [1000], [1500]] creates a 2D array with shape (3, 1) -- 3 rows, 1 column. This matches the training data X which had shape (n, 1). If you accidentally pass [500, 1000, 1500] (a 1D list), scikit-learn will raise a ValueError asking for 2D input. Alternatively, you could use np.array([500, 1000, 1500]).reshape(-1, 1) to convert a flat list to 2D. The values 500, 1000, and 1500 should ideally be within the range of the training data to avoid unreliable extrapolation.',
          options: ['Define new data', 'Generate predictions', 'Display results', 'Fit the model'],
        },
        {
          startLine: 1,
          endLine: 1,
          color: 'XRAY_MODEL',
          correctLabel: 'Generate predictions',
          explanation: 'predict() applies the learned equation (y = slope * x + intercept) to each new value.',
          deepDive: 'For each spend amount, the model calculates: predicted_sales = slope * spend + intercept. This is the same equation it learned during fit(), now applied to new data.',
          deeperDive: 'model.predict(X_new) performs matrix multiplication: predictions = X_new @ coef_.T + intercept_. For each input row, it computes one output value. The result is a NumPy array of shape (3,) -- one prediction per input row. Note that predictions outside the range of the training data (extrapolation) are less reliable than predictions within the range (interpolation). If training data had spend from 100 to 2000, predicting at spend=1500 is interpolation (relatively safe), but predicting at spend=10000 is extrapolation (risky).',
          options: ['Generate predictions', 'Define new data', 'Display results', 'Compute accuracy'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_PREDICT',
          correctLabel: 'Display results',
          explanation: 'Loop through spend values and predictions together to print a readable table.',
          deepDive: 'zip() pairs each spend value with its prediction so you can print them side by side. The loop makes a nice readable output like "Spend $500 -> Sales $1250.00".',
          deeperDive: 'zip(new_spend, predictions) creates pairs: ([500], 1250.0), ([1000], 2500.0), ([1500], 3750.0). The spend variable is a list like [500] (because of the 2D format), so spend[0] extracts the scalar value 500. The :.2f format shows 2 decimal places for the prediction. In a production setting, you might also show a prediction interval (e.g., "Sales $1250 +/- $200") to communicate uncertainty, which you can compute using the standard error of the prediction.',
          options: ['Display results', 'Generate predictions', 'Define new data', 'Save to file'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'newdata',
          code: 'new_spend = [[500], [1000], [1500]]',
          lines: [0],
        },
        {
          id: 'predict',
          code: 'predictions = model.predict(new_spend)',
          lines: [1],
        },
        {
          id: 'display',
          code: "for spend, pred in zip(new_spend, predictions):\n    print(f'Spend ${spend[0]} -> Sales ${pred:.2f}')",
          lines: [3, 4],
        },
      ],
    },

    rewire: {
      goal: 'Change the prediction values to 2000, 3000, and 5000',
      targets: [
        {
          line: 0,
          description: 'Change the input values',
          currentCode: 'new_spend = [[500], [1000], [1500]]',
          options: [
            { label: '[[2000], [3000], [5000]]', newCode: 'new_spend = [[2000], [3000], [5000]]', correct: true },
            { label: '[[200], [300], [500]]', newCode: 'new_spend = [[200], [300], [500]]', correct: false },
            { label: '[2000, 3000, 5000]', newCode: 'new_spend = [2000, 3000, 5000]', correct: false },
          ],
        },
      ],
    },
  },
];
