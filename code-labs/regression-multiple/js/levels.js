// ============================================================
// LEVELS — 8 Lessons across 3 Chapters with X-Ray / Assemble / Rewire rounds
// ============================================================

export const LEVELS = [
  // ================================================================
  // CHAPTER 1: Multiple Variables
  // ================================================================

  // LESSON 1: Multiple Regression
  {
    id: 'multiple_regression',
    name: 'Multiple Regression',
    chapter: 0,
    description: 'Add price, rating, and ads as predictors.',
    tracer: [
      { text: 'Simple regression has one X. Multiple has many.', viz: 'multi_one_vs_many' },
      { text: 'Each column in X is a predictor variable.', viz: 'multi_columns' },
      { text: 'OLS fits a plane through your data cloud.', viz: 'multi_plane' },
    ],
    code: [
      'import statsmodels.api as sm',
      '',
      "X = df[['price', 'rating', 'ads']]",
      'X = sm.add_constant(X)',
      "y = df['sales']",
      '',
      'model = sm.OLS(y, X).fit()',
      'print(model.params)',
    ],

    xray: {
      pipeline: ['Import', 'Select X', 'Add\nConstant', 'Select y', 'Fit OLS'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import statsmodels',
          explanation: 'statsmodels is the go-to library for classical regression in Python.',
          deepDive: 'statsmodels provides OLS (Ordinary Least Squares), hypothesis tests, p-values, R-squared, and everything a statistician needs. The "as sm" alias saves typing.',
          deeperDive: 'statsmodels.api exposes a formula-free interface where you pass matrices X and y directly. It also has statsmodels.formula.api for R-style formulas like "sales ~ price + rating". Unlike sklearn, statsmodels gives you full statistical output: standard errors, confidence intervals, F-statistics, and diagnostic tests like Durbin-Watson.',
          options: ['Import statsmodels', 'Create dummy variables', 'Fit the model', 'Print coefficients'],
        },
        {
          startLine: 2,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Prepare X and y matrices',
          explanation: 'X holds the predictors (with a constant column for the intercept). y is the outcome variable.',
          deepDive: 'add_constant() prepends a column of 1s to X so OLS can estimate an intercept term. Without it, the regression line is forced through the origin.',
          deeperDive: 'In matrix notation, OLS solves y = X*beta + epsilon. The X matrix must have a column of 1s for the intercept. sm.add_constant() adds this automatically. If X has shape (n, 3) for price/rating/ads, after add_constant it becomes (n, 4). The y vector has shape (n,). Forgetting add_constant is one of the most common beginner mistakes -- your model will have no intercept and coefficients will be biased.',
          options: ['Prepare X and y matrices', 'Import statsmodels', 'Fit the model', 'Check p-values'],
        },
        {
          startLine: 6,
          endLine: 7,
          color: 'XRAY_MODEL',
          correctLabel: 'Fit OLS and print coefficients',
          explanation: 'OLS finds the coefficients that minimize squared errors. .params gives each coefficient.',
          deepDive: 'OLS(y, X).fit() runs the regression. The .params attribute is a Series with one coefficient per column in X, including the constant (intercept).',
          deeperDive: 'Under the hood, OLS computes beta = (X\'X)^{-1} X\'y using the normal equation. The .fit() method also computes residuals, R-squared, AIC, BIC, standard errors, t-statistics, and p-values. The params output might look like: const=50.2, price=-2.1, rating=8.3, ads=0.05, meaning each unit increase in price decreases sales by 2.1, controlling for the other variables.',
          options: ['Fit OLS and print coefficients', 'Prepare X and y matrices', 'Create dummy variables', 'Calculate VIF'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'import statsmodels.api as sm',
          lines: [0],
        },
        {
          id: 'prepare_x',
          code: "X = df[['price', 'rating', 'ads']]\nX = sm.add_constant(X)\ny = df['sales']",
          lines: [2, 3, 4],
        },
        {
          id: 'fit',
          code: 'model = sm.OLS(y, X).fit()\nprint(model.params)',
          lines: [6, 7],
        },
      ],
    },

    rewire: {
      goal: 'Use only price and rating (drop ads)',
      targets: [
        {
          line: 2,
          description: 'Change the predictor columns',
          currentCode: "X = df[['price', 'rating', 'ads']]",
          options: [
            { label: "df[['price', 'rating']]", newCode: "X = df[['price', 'rating']]", correct: true },
            { label: "df[['price', 'ads']]", newCode: "X = df[['price', 'ads']]", correct: false },
            { label: "df[['rating']]", newCode: "X = df[['rating']]", correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 2: Reading the Summary
  {
    id: 'reading_summary',
    name: 'Reading the Summary',
    chapter: 0,
    description: 'Interpret R-squared, adjusted R-squared, and p-values.',
    tracer: [
      { text: 'The summary table has everything you need.', viz: 'summary_table' },
      { text: 'R-squared tells you how much variance is explained.', viz: 'summary_r2' },
      { text: 'p-values flag which predictors matter.', viz: 'summary_pvalues' },
    ],
    code: [
      'print(model.summary())',
      '',
      "print(f'R-squared: {model.rsquared:.3f}')",
      "print(f'Adj R-squared: {model.rsquared_adj:.3f}')",
      '',
      'significant = model.pvalues < 0.05',
      'print(significant)',
    ],

    xray: {
      pipeline: ['Summary', 'R-squared', 'Adj R-sq', 'p-values'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_PREDICT',
          correctLabel: 'Print full summary table',
          explanation: 'model.summary() shows coefficients, std errors, t-stats, p-values, R-squared, and more.',
          deepDive: 'The summary table is the core output of any regression. It includes the coefficient estimates, their standard errors, t-statistics, and p-values for each predictor.',
          deeperDive: 'The summary has three sections: (1) top panel with R-squared, F-statistic, AIC/BIC; (2) coefficient table with coef, std err, t, P>|t|, and 95% confidence intervals; (3) diagnostics like Durbin-Watson (autocorrelation), Jarque-Bera (normality), and condition number (multicollinearity). A coefficient is "significant" if its p-value < 0.05.',
          options: ['Print full summary table', 'Fit the model', 'Calculate R-squared', 'Filter p-values'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_MODEL',
          correctLabel: 'Compare R-squared and adjusted R-squared',
          explanation: 'R-squared rises with more predictors. Adjusted R-squared penalizes complexity.',
          deepDive: 'R-squared always goes up when you add a predictor, even a useless one. Adjusted R-squared subtracts a penalty for each added variable, so it can go down if the variable does not help enough.',
          deeperDive: 'R-squared = 1 - SS_res/SS_tot, where SS_res is the sum of squared residuals and SS_tot is the total sum of squares. Adjusted R-squared = 1 - (1-R^2)(n-1)/(n-k-1), where n is sample size and k is the number of predictors. If adjusted R-squared drops when you add a variable, that variable is not worth including. A model with R^2=0.85 and Adj-R^2=0.83 is healthy; R^2=0.85 and Adj-R^2=0.70 suggests overfitting.',
          options: ['Compare R-squared and adjusted R-squared', 'Print full summary table', 'Check p-values', 'Fit the model'],
        },
        {
          startLine: 5,
          endLine: 6,
          color: 'XRAY_TRAIN',
          correctLabel: 'Check which predictors are significant',
          explanation: 'pvalues < 0.05 returns True for each significant predictor.',
          deepDive: 'A p-value below 0.05 means there is less than a 5% chance the coefficient is actually zero. True = significant, False = probably noise.',
          deeperDive: 'The p-value tests H0: beta_j = 0 vs H1: beta_j != 0. It is computed from the t-statistic = coef / std_err. With a large sample, even tiny effects can be "significant," so always check the coefficient magnitude too. model.pvalues is a pandas Series indexed by variable name. The boolean mask significant lets you quickly see which variables to keep.',
          options: ['Check which predictors are significant', 'Print full summary table', 'Compare R-squared and adjusted R-squared', 'Create dummy variables'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'summary',
          code: 'print(model.summary())',
          lines: [0],
        },
        {
          id: 'rsquared',
          code: "print(f'R-squared: {model.rsquared:.3f}')\nprint(f'Adj R-squared: {model.rsquared_adj:.3f}')",
          lines: [2, 3],
        },
        {
          id: 'pvalues',
          code: 'significant = model.pvalues < 0.05\nprint(significant)',
          lines: [5, 6],
        },
      ],
    },

    rewire: {
      goal: 'Use a stricter significance threshold of 0.01',
      targets: [
        {
          line: 5,
          description: 'Change the p-value threshold',
          currentCode: 'significant = model.pvalues < 0.05',
          options: [
            { label: 'model.pvalues < 0.01', newCode: 'significant = model.pvalues < 0.01', correct: true },
            { label: 'model.pvalues < 0.10', newCode: 'significant = model.pvalues < 0.10', correct: false },
            { label: 'model.pvalues > 0.05', newCode: 'significant = model.pvalues > 0.05', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 3: Dummy Variables
  {
    id: 'dummy_variables',
    name: 'Dummy Variables',
    chapter: 0,
    description: 'Encode categories as 0/1 columns.',
    tracer: [
      { text: 'Categories like "Shoes" or "Bags" are text.', viz: 'dummy_text' },
      { text: 'get_dummies turns each category into a 0/1 column.', viz: 'dummy_onehot' },
      { text: 'Concat joins them with your numeric predictors.', viz: 'dummy_concat' },
    ],
    code: [
      "dummies = pd.get_dummies(df['category'])",
      'print(dummies.head())',
      '',
      "X = pd.concat([df[['price']], dummies], axis=1)",
      'X = sm.add_constant(X)',
      'model2 = sm.OLS(y, X).fit()',
      'print(model2.params)',
    ],

    xray: {
      pipeline: ['Dummies', 'Concat', 'Constant', 'Fit'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_DATA',
          correctLabel: 'Create dummy columns from category',
          explanation: 'get_dummies turns each unique category value into its own binary column.',
          deepDive: 'If "category" has values Shoes, Bags, Tops, you get three columns: Shoes (0/1), Bags (0/1), Tops (0/1). Each row has exactly one 1.',
          deeperDive: 'pd.get_dummies() does one-hot encoding. For k categories you get k columns. With an intercept, this causes perfect multicollinearity (the "dummy variable trap"), so you should use drop_first=True to get k-1 columns. statsmodels will warn you about singular matrices if you forget. The dropped category becomes the reference group, and each dummy coefficient measures the difference from that baseline.',
          options: ['Create dummy columns from category', 'Merge dataframes', 'Fit OLS model', 'Calculate R-squared'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_MODEL',
          correctLabel: 'Build feature matrix with dummies',
          explanation: 'pd.concat joins the price column with all dummy columns. add_constant adds the intercept.',
          deepDive: 'axis=1 means column-wise concatenation. The result has price + one column per category + a constant column.',
          deeperDive: 'pd.concat([df_a, df_b], axis=1) horizontally stacks DataFrames. The index must align; if rows are in different orders, use df.reset_index() first. After concat, X might have columns: price, Bags, Shoes, Tops. Then add_constant prepends "const". The model is: sales = b0 + b1*price + b2*Bags + b3*Shoes + b4*Tops.',
          options: ['Build feature matrix with dummies', 'Create dummy columns from category', 'Print model summary', 'Check p-values'],
        },
        {
          startLine: 5,
          endLine: 6,
          color: 'XRAY_PREDICT',
          correctLabel: 'Fit model with category dummies',
          explanation: 'model2 now captures both price effects and category-level differences.',
          deepDive: 'Each dummy coefficient tells you how much sales differ for that category relative to the omitted baseline category, holding price constant.',
          deeperDive: 'If Bags is the omitted baseline and the Shoes coefficient is 12.5, it means shoes sell 12.5 more units than bags on average, controlling for price. The constant term now represents the expected sales for the baseline category at price=0. To interpret interaction effects, you would add price*Shoes columns, but that is more advanced.',
          options: ['Fit model with category dummies', 'Create dummy columns from category', 'Compare R-squared values', 'Print p-values'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'dummies',
          code: "dummies = pd.get_dummies(df['category'])\nprint(dummies.head())",
          lines: [0, 1],
        },
        {
          id: 'concat',
          code: "X = pd.concat([df[['price']], dummies], axis=1)\nX = sm.add_constant(X)",
          lines: [3, 4],
        },
        {
          id: 'fit2',
          code: 'model2 = sm.OLS(y, X).fit()\nprint(model2.params)',
          lines: [5, 6],
        },
      ],
    },

    rewire: {
      goal: 'Drop first dummy to avoid the dummy trap',
      targets: [
        {
          line: 0,
          description: 'Add drop_first parameter',
          currentCode: "dummies = pd.get_dummies(df['category'])",
          options: [
            { label: "get_dummies(df['category'], drop_first=True)", newCode: "dummies = pd.get_dummies(df['category'], drop_first=True)", correct: true },
            { label: "get_dummies(df['category'], drop_first=False)", newCode: "dummies = pd.get_dummies(df['category'], drop_first=False)", correct: false },
            { label: "get_dummies(df['price'])", newCode: "dummies = pd.get_dummies(df['price'])", correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 2: Transforms
  // ================================================================

  // LESSON 4: Log Transform
  {
    id: 'log_transform',
    name: 'Log Transform',
    chapter: 1,
    description: 'Linearize skewed relationships with np.log.',
    tracer: [
      { text: 'Prices and sales are often right-skewed.', viz: 'log_skewed' },
      { text: 'np.log compresses large values, stretches small ones.', viz: 'log_curve' },
      { text: 'A log-log model often fits better.', viz: 'log_fit' },
    ],
    code: [
      'import numpy as np',
      '',
      "df['log_price'] = np.log(df['price'])",
      "df['log_sales'] = np.log(df['sales'])",
      '',
      "X_log = sm.add_constant(df[['log_price']])",
      "model_log = sm.OLS(df['log_sales'], X_log).fit()",
      "print(f'R-squared: {model_log.rsquared:.3f}')",
    ],

    xray: {
      pipeline: ['Import', 'Log X', 'Log y', 'Fit Log'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import NumPy',
          explanation: 'NumPy provides the np.log function for natural logarithm.',
          deepDive: 'NumPy (Numerical Python) is the foundation for all scientific computing in Python. np.log computes the natural log element-wise on arrays and Series.',
          deeperDive: 'np.log is the natural logarithm (base e). For base-10 use np.log10, for base-2 use np.log2. The natural log is preferred in economics and statistics because its derivative is 1/x, which gives coefficients a clean percentage interpretation. np.log(0) returns -inf and np.log(-1) returns nan, so always check for zeros and negatives before transforming.',
          options: ['Import NumPy', 'Create log columns', 'Fit OLS model', 'Print R-squared'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Create log-transformed columns',
          explanation: 'Taking the log of price and sales handles right-skew and makes the relationship more linear.',
          deepDive: 'If price ranges from 5 to 500, log(price) ranges from ~1.6 to ~6.2. This compression helps OLS because the model no longer overweights expensive items.',
          deeperDive: 'Log transforms are appropriate when: (1) the variable is strictly positive, (2) the distribution is right-skewed, (3) the relationship with y is multiplicative rather than additive. A log-log model (log y vs log x) implies a power-law relationship: y = a * x^b, where b is the slope coefficient. A semi-log model (log y vs x) implies exponential growth. Always verify the transform improves residual plots.',
          options: ['Create log-transformed columns', 'Import NumPy', 'Fit log-log model', 'Print coefficients'],
        },
        {
          startLine: 5,
          endLine: 7,
          color: 'XRAY_MODEL',
          correctLabel: 'Fit log-log regression',
          explanation: 'Using log_price to predict log_sales. The R-squared tells you if the fit improved.',
          deepDive: 'If the R-squared is higher than the linear model, the log transform captured curvature that a straight line missed.',
          deeperDive: 'In a log-log model, the coefficient on log_price is the price elasticity of demand: a 1% increase in price leads to a beta% change in sales. This is one of the most useful quantities in pricing analytics. Note: you cannot directly compare R-squared between log(y) and y models because the dependent variable is different. Use AIC or out-of-sample RMSE for fair comparison.',
          options: ['Fit log-log regression', 'Create log-transformed columns', 'Print model summary', 'Calculate VIF'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import_np',
          code: 'import numpy as np',
          lines: [0],
        },
        {
          id: 'log_cols',
          code: "df['log_price'] = np.log(df['price'])\ndf['log_sales'] = np.log(df['sales'])",
          lines: [2, 3],
        },
        {
          id: 'fit_log',
          code: "X_log = sm.add_constant(df[['log_price']])\nmodel_log = sm.OLS(df['log_sales'], X_log).fit()\nprint(f'R-squared: {model_log.rsquared:.3f}')",
          lines: [5, 6, 7],
        },
      ],
    },

    rewire: {
      goal: 'Use log-linear model (only log the sales, not price)',
      targets: [
        {
          line: 5,
          description: 'Change X to use raw price instead of log_price',
          currentCode: "X_log = sm.add_constant(df[['log_price']])",
          options: [
            { label: "df[['price']]", newCode: "X_log = sm.add_constant(df[['price']])", correct: true },
            { label: "df[['log_sales']]", newCode: "X_log = sm.add_constant(df[['log_sales']])", correct: false },
            { label: "df[['log_price', 'price']]", newCode: "X_log = sm.add_constant(df[['log_price', 'price']])", correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 5: Price Elasticity
  {
    id: 'price_elasticity',
    name: 'Price Elasticity',
    chapter: 1,
    description: 'Interpret log-log coefficients as elasticities.',
    tracer: [
      { text: 'In a log-log model, the slope IS the elasticity.', viz: 'elast_slope' },
      { text: 'Elasticity = % change in sales per 1% price change.', viz: 'elast_interpret' },
      { text: 'Negative elasticity means demand goes down.', viz: 'elast_negative' },
    ],
    code: [
      "elasticity = model_log.params['log_price']",
      "print(f'Price elasticity: {elasticity:.3f}')",
      '',
      "print(f'A 1% price increase leads to')",
      "print(f'a {elasticity:.2f}% change in sales')",
    ],

    xray: {
      pipeline: ['Extract\nCoefficient', 'Interpret'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_MODEL',
          correctLabel: 'Extract price elasticity from model',
          explanation: 'In a log-log model, the coefficient on log_price directly gives the price elasticity.',
          deepDive: 'model_log.params is a dictionary-like Series. Indexing by "log_price" gives you the slope, which in log-log regression equals the elasticity.',
          deeperDive: 'Since both y and x are in logs: ln(sales) = a + b*ln(price). Taking the derivative: d(ln sales)/d(ln price) = b. By calculus, d(ln z) = dz/z, so b = (% change in sales)/(% change in price). This is the definition of price elasticity of demand. A value of -1.5 means demand is elastic: a 1% price increase causes a 1.5% drop in sales. Values between -1 and 0 indicate inelastic demand.',
          options: ['Extract price elasticity from model', 'Fit a new model', 'Print model summary', 'Calculate R-squared'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_PREDICT',
          correctLabel: 'Interpret the elasticity value',
          explanation: 'The print statements make the elasticity easy to communicate to stakeholders.',
          deepDive: 'If elasticity = -1.2, a 1% price hike leads to a 1.2% drop in sales. For a 10% price increase, sales drop roughly 12%.',
          deeperDive: 'The percentage interpretation is an approximation. For small changes, ln(1 + x) is approximately x, so the approximation is very good for 1-5% changes. For larger changes (e.g., 50%), you should use the exact formula: %change_sales = (new_price/old_price)^elasticity - 1. This matters in practice when running large promotional discounts. Always report confidence intervals: if the 95% CI for elasticity is [-1.8, -0.6], the true effect could vary substantially.',
          options: ['Interpret the elasticity value', 'Extract price elasticity from model', 'Create log columns', 'Check p-values'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'extract',
          code: "elasticity = model_log.params['log_price']\nprint(f'Price elasticity: {elasticity:.3f}')",
          lines: [0, 1],
        },
        {
          id: 'interpret',
          code: "print(f'A 1% price increase leads to')\nprint(f'a {elasticity:.2f}% change in sales')",
          lines: [3, 4],
        },
      ],
    },

    rewire: {
      goal: 'Show the effect of a 10% price increase',
      targets: [
        {
          line: 3,
          description: 'Change the percentage in the message',
          currentCode: "print(f'A 1% price increase leads to')",
          options: [
            { label: "'A 10% price increase leads to'", newCode: "print(f'A 10% price increase leads to')", correct: true },
            { label: "'A 5% price increase leads to'", newCode: "print(f'A 5% price increase leads to')", correct: false },
            { label: "'A 1% price decrease leads to'", newCode: "print(f'A 1% price decrease leads to')", correct: false },
          ],
        },
        {
          line: 4,
          description: 'Multiply elasticity by 10',
          currentCode: "print(f'a {elasticity:.2f}% change in sales')",
          options: [
            { label: '{elasticity * 10:.2f}%', newCode: "print(f'a {elasticity * 10:.2f}% change in sales')", correct: true },
            { label: '{elasticity / 10:.2f}%', newCode: "print(f'a {elasticity / 10:.2f}% change in sales')", correct: false },
            { label: '{elasticity + 10:.2f}%', newCode: "print(f'a {elasticity + 10:.2f}% change in sales')", correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 6: Multicollinearity
  {
    id: 'multicollinearity',
    name: 'Multicollinearity',
    chapter: 1,
    description: 'Detect correlated predictors with VIF.',
    tracer: [
      { text: 'If two X variables are highly correlated, coefficients wobble.', viz: 'vif_corr' },
      { text: 'VIF measures how much each variable inflates variance.', viz: 'vif_formula' },
      { text: 'VIF > 5 is a red flag. Consider dropping one variable.', viz: 'vif_threshold' },
    ],
    code: [
      "corr_matrix = df[['price', 'rating', 'ads']].corr()",
      'print(corr_matrix)',
      '',
      'from statsmodels.stats.outliers_influence import variance_inflation_factor',
      'vif = [variance_inflation_factor(X.values, i)',
      '       for i in range(X.shape[1])]',
      "print(f'VIF values: {vif}')",
    ],

    xray: {
      pipeline: ['Correlation\nMatrix', 'Import\nVIF', 'Calculate\nVIF'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_DATA',
          correctLabel: 'Compute correlation matrix',
          explanation: '.corr() shows pairwise correlations between all numeric columns.',
          deepDive: 'Correlations range from -1 to 1. Values above 0.7 or below -0.7 suggest potential multicollinearity. The diagonal is always 1 (each variable correlates perfectly with itself).',
          deeperDive: 'Pearson correlation measures linear association. The correlation matrix is symmetric: corr(price, ads) = corr(ads, price). High correlation between predictors does not bias coefficient estimates, but it inflates their standard errors, making it hard to tell which variable is actually driving the effect. A correlation matrix is a quick first check, but VIF is more reliable because it captures multi-way correlations that pairwise checks miss.',
          options: ['Compute correlation matrix', 'Calculate VIF values', 'Fit the model', 'Check p-values'],
        },
        {
          startLine: 3,
          endLine: 3,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import VIF function',
          explanation: 'variance_inflation_factor is in statsmodels outliers_influence module.',
          deepDive: 'VIF is the standard diagnostic for multicollinearity. It regresses each X variable on all other X variables to measure redundancy.',
          deeperDive: 'VIF_j = 1 / (1 - R^2_j), where R^2_j is the R-squared from regressing X_j on all other X variables. If X_j can be perfectly predicted from the others, R^2_j = 1 and VIF = infinity. A VIF of 1 means no collinearity; 5 is concerning; 10 is serious. The function takes the full X matrix (including the constant) and a column index.',
          options: ['Import VIF function', 'Compute correlation matrix', 'Fit OLS model', 'Print coefficients'],
        },
        {
          startLine: 4,
          endLine: 6,
          color: 'XRAY_TRAIN',
          correctLabel: 'Calculate VIF for each predictor',
          explanation: 'Loop through each column and compute its VIF. High values mean collinearity problems.',
          deepDive: 'This list comprehension runs VIF for column 0 (constant), 1 (price), 2 (rating), 3 (ads). Ignore the constant VIF; focus on the predictor VIFs.',
          deeperDive: 'X.values converts the DataFrame to a NumPy array, which variance_inflation_factor requires. X.shape[1] is the number of columns. The VIF for the constant is meaningless and typically very high -- always ignore it. If a predictor has VIF > 5, consider: (1) dropping it, (2) combining correlated predictors into an index, or (3) using regularized regression like Ridge which handles collinearity gracefully.',
          options: ['Calculate VIF for each predictor', 'Import VIF function', 'Compute correlation matrix', 'Drop a column'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'corr',
          code: "corr_matrix = df[['price', 'rating', 'ads']].corr()\nprint(corr_matrix)",
          lines: [0, 1],
        },
        {
          id: 'import_vif',
          code: 'from statsmodels.stats.outliers_influence import variance_inflation_factor',
          lines: [3],
        },
        {
          id: 'calc_vif',
          code: "vif = [variance_inflation_factor(X.values, i)\n       for i in range(X.shape[1])]\nprint(f'VIF values: {vif}')",
          lines: [4, 5, 6],
        },
      ],
    },

    rewire: {
      goal: 'Only compute VIF for predictors (skip the constant)',
      targets: [
        {
          line: 5,
          description: 'Start range at 1 to skip constant column',
          currentCode: '       for i in range(X.shape[1])]',
          options: [
            { label: 'range(1, X.shape[1])', newCode: '       for i in range(1, X.shape[1])]', correct: true },
            { label: 'range(0, X.shape[1])', newCode: '       for i in range(0, X.shape[1])]', correct: false },
            { label: 'range(X.shape[0])', newCode: '       for i in range(X.shape[0])]', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 3: Compare Models
  // ================================================================

  // LESSON 7: Compare Models
  {
    id: 'compare_models',
    name: 'Compare Models',
    chapter: 2,
    description: 'Use adjusted R-squared and AIC to pick the best model.',
    tracer: [
      { text: 'You have built multiple models. Which is best?', viz: 'compare_models_intro' },
      { text: 'Adjusted R-squared penalizes unnecessary complexity.', viz: 'compare_adjr2' },
      { text: 'AIC: lower is better. It balances fit and simplicity.', viz: 'compare_aic' },
    ],
    code: [
      "print(f'Model 1 Adj-R2: {model.rsquared_adj:.3f}')",
      "print(f'Model 2 Adj-R2: {model2.rsquared_adj:.3f}')",
      "print(f'Log Model Adj-R2: {model_log.rsquared_adj:.3f}')",
      '',
      'aic_vals = [model.aic, model2.aic, model_log.aic]',
      "best = ['Model 1', 'Model 2', 'Log'][aic_vals.index(min(aic_vals))]",
      "print(f'Best by AIC: {best}')",
    ],

    xray: {
      pipeline: ['Adj-R2\nComparison', 'AIC\nComparison', 'Pick\nBest'],
      regions: [
        {
          startLine: 0,
          endLine: 2,
          color: 'XRAY_MODEL',
          correctLabel: 'Compare adjusted R-squared values',
          explanation: 'Higher adjusted R-squared = better fit after penalizing for number of predictors.',
          deepDive: 'Printing all three adjusted R-squared values side by side lets you instantly see which model explains the most variance without overfitting.',
          deeperDive: 'Adjusted R-squared = 1 - (1-R^2)(n-1)/(n-k-1). When comparing models with different dependent variables (e.g., y vs log(y)), adjusted R-squared is not directly comparable because the scale of the residuals differs. In that case, use AIC or transform predictions back to the original scale and compare RMSE.',
          options: ['Compare adjusted R-squared values', 'Calculate AIC values', 'Pick the best model', 'Print coefficients'],
        },
        {
          startLine: 4,
          endLine: 6,
          color: 'XRAY_TRAIN',
          correctLabel: 'Select best model by AIC',
          explanation: 'AIC (Akaike Information Criterion) trades off log-likelihood and parameter count. Lower is better.',
          deepDive: 'aic_vals collects the AIC from each model. min() finds the lowest, and .index() tells you which model won. The winner balances good fit with fewer parameters.',
          deeperDive: 'AIC = 2k - 2*ln(L), where k is the number of parameters and L is the maximized likelihood. BIC = k*ln(n) - 2*ln(L), which penalizes complexity more heavily. AIC is better for prediction; BIC is better for identifying the "true" model. A difference of <2 in AIC is negligible; 4-7 means some evidence; >10 means strong evidence that the lower-AIC model is better. Note: AIC values across models with different y transformations are not directly comparable.',
          options: ['Select best model by AIC', 'Compare adjusted R-squared values', 'Fit a new model', 'Check multicollinearity'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'adjr2',
          code: "print(f'Model 1 Adj-R2: {model.rsquared_adj:.3f}')\nprint(f'Model 2 Adj-R2: {model2.rsquared_adj:.3f}')\nprint(f'Log Model Adj-R2: {model_log.rsquared_adj:.3f}')",
          lines: [0, 1, 2],
        },
        {
          id: 'aic',
          code: "aic_vals = [model.aic, model2.aic, model_log.aic]\nbest = ['Model 1', 'Model 2', 'Log'][aic_vals.index(min(aic_vals))]\nprint(f'Best by AIC: {best}')",
          lines: [4, 5, 6],
        },
      ],
    },

    rewire: {
      goal: 'Use BIC instead of AIC for model selection',
      targets: [
        {
          line: 4,
          description: 'Change from AIC to BIC',
          currentCode: 'aic_vals = [model.aic, model2.aic, model_log.aic]',
          options: [
            { label: '[model.bic, model2.bic, model_log.bic]', newCode: 'aic_vals = [model.bic, model2.bic, model_log.bic]', correct: true },
            { label: '[model.rsquared, model2.rsquared, model_log.rsquared]', newCode: 'aic_vals = [model.rsquared, model2.rsquared, model_log.rsquared]', correct: false },
            { label: '[model.fvalue, model2.fvalue, model_log.fvalue]', newCode: 'aic_vals = [model.fvalue, model2.fvalue, model_log.fvalue]', correct: false },
          ],
        },
        {
          line: 6,
          description: 'Update the label to say BIC',
          currentCode: "print(f'Best by AIC: {best}')",
          options: [
            { label: "'Best by BIC: {best}'", newCode: "print(f'Best by BIC: {best}')", correct: true },
            { label: "'Best by R2: {best}'", newCode: "print(f'Best by R2: {best}')", correct: false },
            { label: "'Best by AIC: {best}'", newCode: "print(f'Best by AIC: {best}')", correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 8: Predict a Price
  {
    id: 'predict_price',
    name: 'Predict a Price',
    chapter: 2,
    description: 'Use the fitted model to predict sales for new data.',
    tracer: [
      { text: 'Your model is trained. Now use it on new data.', viz: 'predict_new' },
      { text: 'Build a DataFrame with the same columns as X.', viz: 'predict_dataframe' },
      { text: 'model.predict() returns the expected sales.', viz: 'predict_output' },
    ],
    code: [
      'new_data = pd.DataFrame({',
      "    'price': [29.99],",
      "    'rating': [4.5],",
      "    'ads': [1000],",
      '})',
      'new_X = sm.add_constant(new_data)',
      '',
      'prediction = model.predict(new_X)',
      "print(f'Predicted sales: ${prediction[0]:.2f}')",
    ],

    xray: {
      pipeline: ['New\nData', 'Add\nConstant', 'Predict'],
      regions: [
        {
          startLine: 0,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Create new data for prediction',
          explanation: 'Build a DataFrame with the same columns the model was trained on.',
          deepDive: 'The new_data DataFrame must have exactly the same column names as the original X (minus the constant). Here we predict for a product priced at $29.99 with a 4.5 rating and 1000 ad impressions.',
          deeperDive: 'pd.DataFrame({...}) creates a one-row DataFrame. Each key is a column name, and the value is a list with one element. Column names must match exactly -- "price" not "Price". If the model used log_price, you would need to apply np.log here too. For multiple predictions, add more elements to each list: "price": [29.99, 49.99, 99.99]. statsmodels will raise a ValueError if column names do not match.',
          options: ['Create new data for prediction', 'Add the constant column', 'Run the prediction', 'Print the result'],
        },
        {
          startLine: 5,
          endLine: 5,
          color: 'XRAY_MODEL',
          correctLabel: 'Add constant for intercept',
          explanation: 'Just like training, the prediction data needs a constant column.',
          deepDive: 'sm.add_constant(new_data) adds a "const" column with value 1.0. Without it, the model cannot apply its intercept term and predictions will be wrong.',
          deeperDive: 'The model learned coefficients [b0, b1, b2, b3] where b0 is the intercept. The prediction is b0*1 + b1*price + b2*rating + b3*ads. If you forget add_constant, statsmodels may raise a shape mismatch error, or silently treat one of your predictors as the constant. Always match the exact preprocessing pipeline used during training.',
          options: ['Add constant for intercept', 'Create new data for prediction', 'Run the prediction', 'Compute residuals'],
        },
        {
          startLine: 7,
          endLine: 8,
          color: 'XRAY_PREDICT',
          correctLabel: 'Generate and print prediction',
          explanation: 'model.predict(new_X) returns an array of predicted values. [0] gets the first (and only) prediction.',
          deepDive: 'The predicted value is the model\'s best estimate of sales for the given price, rating, and ad spend. Format with :.2f for two decimal places.',
          deeperDive: 'model.predict() returns a NumPy array. For one row of new data, it has one element. You can also get prediction intervals with model.get_prediction(new_X).summary_frame(), which gives mean, mean_se, mean_ci_lower, mean_ci_upper, obs_ci_lower, obs_ci_upper. The mean CI captures uncertainty in the regression line; the observation CI includes the residual noise, so it is always wider.',
          options: ['Generate and print prediction', 'Create new data for prediction', 'Add constant for intercept', 'Compare AIC values'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'new_data',
          code: "new_data = pd.DataFrame({\n    'price': [29.99],\n    'rating': [4.5],\n    'ads': [1000],\n})",
          lines: [0, 1, 2, 3, 4],
        },
        {
          id: 'add_const',
          code: 'new_X = sm.add_constant(new_data)',
          lines: [5],
        },
        {
          id: 'predict',
          code: "prediction = model.predict(new_X)\nprint(f'Predicted sales: ${prediction[0]:.2f}')",
          lines: [7, 8],
        },
      ],
    },

    rewire: {
      goal: 'Predict for a premium product at $99.99',
      targets: [
        {
          line: 1,
          description: 'Change the price value',
          currentCode: "    'price': [29.99],",
          options: [
            { label: "'price': [99.99]", newCode: "    'price': [99.99],", correct: true },
            { label: "'price': [9.99]", newCode: "    'price': [9.99],", correct: false },
            { label: "'cost': [99.99]", newCode: "    'cost': [99.99],", correct: false },
          ],
        },
      ],
    },
  },
];
