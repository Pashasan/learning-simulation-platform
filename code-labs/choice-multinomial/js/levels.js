// ============================================================
// LEVELS — 8 Lessons across 3 Chapters with X-Ray / Assemble / Rewire rounds
// Discrete Choice 2: Multinomial Choice, Softmax, Market Simulation
// ============================================================

export const LEVELS = [
  // ================================================================
  // CHAPTER 1: Softmax & Shares
  // ================================================================

  // LESSON 1: Softmax Probabilities
  {
    id: 'softmax_probabilities',
    name: 'Softmax Probabilities',
    chapter: 0,
    description: 'Compute market shares from utilities using the softmax function.',
    tracer: [
      { text: 'Each option has a utility score.', viz: 'softmax_utilities' },
      { text: 'Exponentiate each utility.', viz: 'softmax_exp' },
      { text: 'Divide by the sum to get shares.', viz: 'softmax_shares' },
    ],
    code: [
      'import numpy as np',
      '',
      'V = np.array([2.0, 1.0, 0.5])',
      'exp_V = np.exp(V)',
      'shares = exp_V / exp_V.sum()',
      '',
      'print(shares)',
    ],

    xray: {
      pipeline: ['import', 'utilities', 'softmax'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import NumPy',
          explanation: 'NumPy provides array math for fast numerical computation.',
          deepDive: 'NumPy is the standard library for numerical computing in Python. It gives you fast array operations, linear algebra, and mathematical functions -- all essential for computing market shares.',
          deeperDive: 'NumPy arrays are stored as contiguous blocks of memory, making element-wise operations like np.exp() run 10-100x faster than looping over a Python list. When you write np.exp(V), NumPy applies the exponential function to every element in a single optimized C call. This is called vectorization. For choice models with thousands of observations, this speed difference matters enormously.',
          options: ['Import NumPy', 'Define utilities', 'Compute softmax', 'Print results'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Define utilities and exponentiate',
          explanation: 'V holds utility scores for 3 options. np.exp converts them to positive values.',
          deepDive: 'Each number in V represents how attractive an option is. Higher utility means more desirable. Exponentiating ensures all values are positive, which is necessary before dividing to get probabilities.',
          deeperDive: 'The utility values V can be any real number -- positive, negative, or zero. The exponential function e^x maps any real number to a positive number: e^2.0 = 7.39, e^1.0 = 2.72, e^0.5 = 1.65. This monotonic transformation preserves the ranking (higher utility still means higher share) while ensuring no negative values. In a real model, utilities are computed as V = beta_0 + beta_1*price + beta_2*quality + ..., where the betas are estimated from data.',
          options: ['Define utilities and exponentiate', 'Import NumPy', 'Compute market shares', 'Print results'],
        },
        {
          startLine: 4,
          endLine: 6,
          color: 'XRAY_PREDICT',
          correctLabel: 'Compute and display shares',
          explanation: 'Dividing by the sum normalizes to probabilities that add up to 1.',
          deepDive: 'The softmax formula: share_i = exp(V_i) / sum(exp(V_j)). This guarantees every share is between 0 and 1, and all shares sum to exactly 1 -- just like market share percentages.',
          deeperDive: 'For our values: exp(2.0)/(exp(2.0)+exp(1.0)+exp(0.5)) = 7.39/(7.39+2.72+1.65) = 7.39/11.76 = 0.628. So option 1 gets 62.8% share, option 2 gets 23.1%, and option 3 gets 14.0%. The softmax function is also called the multinomial logit probability. It is the foundation of discrete choice models in economics and marketing. The key property: changing one option\'s utility affects ALL shares, not just that option\'s.',
          options: ['Compute and display shares', 'Define utilities', 'Import NumPy', 'Exponentiate utilities'],
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
          id: 'utilities',
          code: 'V = np.array([2.0, 1.0, 0.5])',
          lines: [2],
        },
        {
          id: 'softmax',
          code: 'exp_V = np.exp(V)\nshares = exp_V / exp_V.sum()',
          lines: [3, 4],
        },
        {
          id: 'print',
          code: 'print(shares)',
          lines: [6],
        },
      ],
    },

    rewire: {
      goal: 'Add a 4th option with utility 1.5',
      targets: [
        {
          line: 2,
          description: 'Add the new option',
          currentCode: 'V = np.array([2.0, 1.0, 0.5])',
          options: [
            { label: 'np.array([2.0, 1.0, 0.5, 1.5])', newCode: 'V = np.array([2.0, 1.0, 0.5, 1.5])', correct: true },
            { label: 'np.array([2.0, 1.0, 1.5])', newCode: 'V = np.array([2.0, 1.0, 1.5])', correct: false },
            { label: 'np.array([2.0, 1.5, 0.5])', newCode: 'V = np.array([2.0, 1.5, 0.5])', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 2: Price Changes All Shares
  {
    id: 'price_changes_shares',
    name: 'Price Changes Shares',
    chapter: 0,
    description: 'See how changing one price shifts all market shares.',
    tracer: [
      { text: 'Price enters the utility formula.', viz: 'price_utility' },
      { text: 'Loop over prices to see the effect.', viz: 'price_loop' },
      { text: 'Shares shift as price changes.', viz: 'price_shift' },
    ],
    code: [
      'import numpy as np',
      '',
      'beta_price = -0.5',
      'base_V = np.array([2.0, 1.0, 0.5])',
      '',
      'for price_change in [0, 0.5, 1.0, 1.5]:',
      '    V = base_V.copy()',
      '    V[0] += beta_price * price_change',
      '    exp_V = np.exp(V)',
      '    shares = exp_V / exp_V.sum()',
      '    print(f"Price +{price_change}: {shares}")',
    ],

    xray: {
      pipeline: ['import', 'params', 'loop', 'softmax'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import NumPy',
          explanation: 'NumPy for array math and exponentiation.',
          deepDive: 'Same import as before. NumPy handles all the vector math we need for computing softmax shares across multiple price scenarios.',
          deeperDive: 'NumPy\'s broadcasting feature lets you write V[0] += beta_price * price_change and it automatically applies the scalar operation to just that element. Without NumPy, you would need to manually index into a list and handle the arithmetic yourself. The .copy() method creates an independent copy so changes to V don\'t affect base_V.',
          options: ['Import NumPy', 'Set price coefficient', 'Loop over prices', 'Compute shares'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Set price coefficient and base utilities',
          explanation: 'beta_price = -0.5 means higher prices reduce utility. base_V holds starting utilities.',
          deepDive: 'The negative beta means price hurts attractiveness -- a $1 increase reduces utility by 0.5. The base utilities represent non-price attractiveness (brand, quality, features).',
          deeperDive: 'In a real multinomial logit model, the utility of option j is V_j = beta_0 + beta_price * price_j + beta_quality * quality_j + ... The beta_price coefficient is almost always negative (people dislike higher prices). Its magnitude tells you price sensitivity: beta = -0.5 means moderate sensitivity, while beta = -2.0 means very price-sensitive consumers. The ratio -beta_feature / beta_price gives willingness to pay for that feature.',
          options: ['Set price coefficient and base utilities', 'Import NumPy', 'Loop over prices', 'Print results'],
        },
        {
          startLine: 5,
          endLine: 10,
          color: 'XRAY_TRAIN',
          correctLabel: 'Loop: adjust price, recompute shares',
          explanation: 'For each price increase, update utility and recalculate all shares via softmax.',
          deepDive: 'Each iteration raises the price of option 1 and recomputes everyone\'s share. As option 1 gets more expensive, its share drops and competitors gain -- even though their prices did not change.',
          deeperDive: 'This is the key insight of the multinomial logit: changing one option affects ALL shares. When price_change = 1.0, V[0] drops by 0.5 (from 2.0 to 1.5). The softmax denominator changes, so every option\'s share is recalculated. Option 1\'s share falls, and options 2 and 3 both gain. The .copy() is critical -- without it, V would be a reference to base_V, and modifications would accumulate across iterations, giving wrong results.',
          options: ['Loop: adjust price, recompute shares', 'Set base utilities', 'Import NumPy', 'Define beta coefficient'],
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
          id: 'params',
          code: 'beta_price = -0.5\nbase_V = np.array([2.0, 1.0, 0.5])',
          lines: [2, 3],
        },
        {
          id: 'loop',
          code: 'for price_change in [0, 0.5, 1.0, 1.5]:\n    V = base_V.copy()\n    V[0] += beta_price * price_change',
          lines: [5, 6, 7],
        },
        {
          id: 'softmax',
          code: '    exp_V = np.exp(V)\n    shares = exp_V / exp_V.sum()\n    print(f"Price +{price_change}: {shares}")',
          lines: [8, 9, 10],
        },
      ],
    },

    rewire: {
      goal: 'Make consumers more price-sensitive (beta = -1.0)',
      targets: [
        {
          line: 2,
          description: 'Increase price sensitivity',
          currentCode: 'beta_price = -0.5',
          options: [
            { label: 'beta_price = -1.0', newCode: 'beta_price = -1.0', correct: true },
            { label: 'beta_price = -0.25', newCode: 'beta_price = -0.25', correct: false },
            { label: 'beta_price = 0.5', newCode: 'beta_price = 0.5', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 3: Fit Multinomial Model
  {
    id: 'fit_multinomial_model',
    name: 'Fit Multinomial Model',
    chapter: 0,
    description: 'Estimate a multinomial logit model from choice data.',
    tracer: [
      { text: 'Choice data: who picked what.', viz: 'mnl_data' },
      { text: 'MNLogit estimates the betas.', viz: 'mnl_fit' },
      { text: 'Summary shows coefficients and significance.', viz: 'mnl_summary' },
    ],
    code: [
      'import statsmodels.api as sm',
      'import pandas as pd',
      '',
      'df = pd.DataFrame({',
      "    'choice': [0, 1, 2, 0, 1, 0, 2, 1],",
      "    'price':  [5, 8, 6, 4, 9, 5, 7, 8],",
      "    'quality':[3, 4, 2, 3, 5, 4, 2, 4]",
      '})',
      '',
      "X = sm.add_constant(df[['price', 'quality']])",
      "model = sm.MNLogit(df['choice'], X)",
      'result = model.fit(disp=0)',
      'print(result.summary())',
    ],

    xray: {
      pipeline: ['imports', 'data', 'fit', 'summary'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import statistics and data libraries',
          explanation: 'statsmodels provides MNLogit; pandas organizes the data into a table.',
          deepDive: 'statsmodels is the go-to library for econometric models in Python. pandas gives you DataFrames -- spreadsheet-like tables that make data manipulation easy.',
          deeperDive: 'statsmodels.api (aliased as sm) provides the MNLogit class specifically designed for multinomial logistic regression. Unlike scikit-learn\'s LogisticRegression, statsmodels gives you a full summary table with standard errors, p-values, confidence intervals, and log-likelihood -- everything an economist needs to interpret the model. pandas DataFrames let you access columns by name (df["price"]) and handle missing data gracefully.',
          options: ['Import statistics and data libraries', 'Create the dataset', 'Fit the model', 'Print summary'],
        },
        {
          startLine: 3,
          endLine: 7,
          color: 'XRAY_DATA',
          correctLabel: 'Create choice dataset',
          explanation: 'Each row is a consumer: which option they chose, the price, and quality they saw.',
          deepDive: 'The "choice" column (0, 1, or 2) records which of 3 options each person picked. Price and quality are the attributes that influence the decision.',
          deeperDive: 'In real discrete choice analysis, data comes from surveys (conjoint analysis) or observed market transactions. Each row represents one choice occasion. The "choice" column is the dependent variable (categorical: 0, 1, or 2). The independent variables (price, quality) describe the attributes of the options. MNLogit needs the data in "wide" format where each row is an observation. With 8 observations and 3 choices, this is a tiny example -- real studies use hundreds or thousands of observations for reliable coefficient estimates.',
          options: ['Create choice dataset', 'Import libraries', 'Fit the model', 'Print results'],
        },
        {
          startLine: 9,
          endLine: 11,
          color: 'XRAY_MODEL',
          correctLabel: 'Fit multinomial logit model',
          explanation: 'add_constant adds an intercept. MNLogit estimates coefficients for each choice.',
          deepDive: 'add_constant adds a column of 1s for the intercept term. MNLogit then finds the beta values that best explain the observed choices. fit() runs the maximum likelihood optimization.',
          deeperDive: 'sm.add_constant() prepends a column of 1.0 values to the X matrix, allowing the model to estimate intercept terms (alternative-specific constants). Without it, the model assumes all alternatives have equal baseline attractiveness. MNLogit uses maximum likelihood estimation (MLE) -- it finds the beta values that maximize the probability of observing the actual choices in the data. The disp=0 argument suppresses the optimization progress output. The result object contains .params (coefficients), .pvalues, .bse (standard errors), and .llf (log-likelihood).',
          options: ['Fit multinomial logit model', 'Create dataset', 'Import libraries', 'Display summary'],
        },
        {
          startLine: 12,
          endLine: 12,
          color: 'XRAY_PREDICT',
          correctLabel: 'Display model summary',
          explanation: 'The summary shows coefficients, p-values, and model fit statistics.',
          deepDive: 'The summary table shows how much each variable (price, quality) influences the choice. Negative price coefficient means higher price reduces the chance of being chosen.',
          deeperDive: 'The summary displays one set of coefficients per alternative (relative to the base alternative, usually choice=0). A price coefficient of -0.3 for alternative 1 means a $1 price increase for option 1 reduces its log-odds by 0.3 relative to option 0. The p-value tells you if the coefficient is statistically significant (p < 0.05). Pseudo R-squared measures model fit (0 = no better than random, 1 = perfect prediction). Log-likelihood (LL) is used for model comparison via likelihood ratio tests or AIC/BIC.',
          options: ['Display model summary', 'Fit the model', 'Create dataset', 'Import libraries'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'imports',
          code: 'import statsmodels.api as sm\nimport pandas as pd',
          lines: [0, 1],
        },
        {
          id: 'data',
          code: "df = pd.DataFrame({\n    'choice': [0, 1, 2, 0, 1, 0, 2, 1],\n    'price':  [5, 8, 6, 4, 9, 5, 7, 8],\n    'quality':[3, 4, 2, 3, 5, 4, 2, 4]\n})",
          lines: [3, 4, 5, 6, 7],
        },
        {
          id: 'fit',
          code: "X = sm.add_constant(df[['price', 'quality']])\nmodel = sm.MNLogit(df['choice'], X)\nresult = model.fit(disp=0)",
          lines: [9, 10, 11],
        },
        {
          id: 'summary',
          code: 'print(result.summary())',
          lines: [12],
        },
      ],
    },

    rewire: {
      goal: 'Add a brand variable to the model',
      targets: [
        {
          line: 9,
          description: 'Include brand in the features',
          currentCode: "X = sm.add_constant(df[['price', 'quality']])",
          options: [
            { label: "df[['price', 'quality', 'brand']]", newCode: "X = sm.add_constant(df[['price', 'quality', 'brand']])", correct: true },
            { label: "df[['price', 'brand']]", newCode: "X = sm.add_constant(df[['price', 'brand']])", correct: false },
            { label: "df[['brand']]", newCode: "X = sm.add_constant(df[['brand']])", correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 2: Interpret Results
  // ================================================================

  // LESSON 4: Willingness to Pay
  {
    id: 'willingness_to_pay',
    name: 'Willingness to Pay',
    chapter: 1,
    description: 'Calculate how much consumers will pay for a feature.',
    tracer: [
      { text: 'Coefficients measure importance.', viz: 'wtp_coefficients' },
      { text: 'WTP = -beta_feature / beta_price.', viz: 'wtp_formula' },
      { text: 'The result is in dollar terms.', viz: 'wtp_result' },
    ],
    code: [
      '# From fitted model',
      'beta_price = -0.5',
      'beta_quality = 0.8',
      'beta_brand = 0.6',
      '',
      'wtp_quality = -beta_quality / beta_price',
      'wtp_brand = -beta_brand / beta_price',
      '',
      'print(f"WTP for quality: ${wtp_quality:.2f}")',
      'print(f"WTP for brand: ${wtp_brand:.2f}")',
    ],

    xray: {
      pipeline: ['coefficients', 'WTP formula', 'results'],
      regions: [
        {
          startLine: 0,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Model coefficients',
          explanation: 'These betas come from the fitted MNLogit model. They measure each attribute\'s impact.',
          deepDive: 'Price has a negative coefficient (people dislike higher prices). Quality and brand have positive coefficients (people value them). The magnitudes tell you how much each matters.',
          deeperDive: 'In a multinomial logit, the utility of an option is V = beta_price * price + beta_quality * quality + beta_brand * brand + ... Each beta measures the marginal change in utility for a one-unit increase in that attribute. beta_price = -0.5 means each additional dollar of price reduces utility by 0.5 units. beta_quality = 0.8 means each quality point adds 0.8 utility units. These raw utility units are abstract -- WTP converts them into meaningful dollar amounts.',
          options: ['Model coefficients', 'WTP formula', 'Print WTP values', 'Import libraries'],
        },
        {
          startLine: 5,
          endLine: 6,
          color: 'XRAY_MODEL',
          correctLabel: 'Compute WTP for each feature',
          explanation: 'WTP = -beta_feature / beta_price converts utility units into dollars.',
          deepDive: 'Think of it as: how many dollars of price increase would exactly cancel out one unit of quality improvement? The negation handles the fact that price has a negative effect.',
          deeperDive: 'The formula WTP = -beta_feature / beta_price comes from setting the utility change to zero: beta_price * delta_price + beta_feature * delta_feature = 0. Solving for delta_price when delta_feature = 1 gives delta_price = -beta_feature / beta_price. For quality: -0.8 / (-0.5) = $1.60, meaning consumers would pay up to $1.60 extra for one quality point. For brand: -0.6 / (-0.5) = $1.20. This is a powerful marketing insight -- it tells you exactly how to price a feature upgrade.',
          options: ['Compute WTP for each feature', 'Model coefficients', 'Print results', 'Define utilities'],
        },
        {
          startLine: 8,
          endLine: 9,
          color: 'XRAY_PREDICT',
          correctLabel: 'Display WTP in dollars',
          explanation: 'The f-string formats the WTP as a dollar amount with 2 decimal places.',
          deepDive: 'WTP for quality = $1.60 means consumers value one quality point at $1.60. If improving quality costs less than $1.60, it is worth doing because consumers would pay for it.',
          deeperDive: 'WTP has direct business applications: if R&D costs $1.00 per unit to improve quality by 1 point, but consumers would pay $1.60 more, the improvement generates $0.60 profit per unit. For brand improvements (advertising, packaging), if brand perception improves by 1 unit at a cost of $0.80 but WTP is $1.20, the investment is profitable. WTP also helps in pricing new products: sum up the WTP for each feature to estimate the maximum viable price point.',
          options: ['Display WTP in dollars', 'Compute WTP', 'Define coefficients', 'Fit model'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'coefficients',
          code: "# From fitted model\nbeta_price = -0.5\nbeta_quality = 0.8\nbeta_brand = 0.6",
          lines: [0, 1, 2, 3],
        },
        {
          id: 'wtp',
          code: 'wtp_quality = -beta_quality / beta_price\nwtp_brand = -beta_brand / beta_price',
          lines: [5, 6],
        },
        {
          id: 'print',
          code: 'print(f"WTP for quality: ${wtp_quality:.2f}")\nprint(f"WTP for brand: ${wtp_brand:.2f}")',
          lines: [8, 9],
        },
      ],
    },

    rewire: {
      goal: 'Add WTP for a new "eco" feature with beta = 0.4',
      targets: [
        {
          line: 6,
          description: 'Add the eco WTP calculation',
          currentCode: 'wtp_brand = -beta_brand / beta_price',
          options: [
            { label: 'wtp_eco = -0.4 / beta_price', newCode: 'wtp_eco = -0.4 / beta_price', correct: true },
            { label: 'wtp_eco = 0.4 / beta_price', newCode: 'wtp_eco = 0.4 / beta_price', correct: false },
            { label: 'wtp_eco = -0.4 * beta_price', newCode: 'wtp_eco = -0.4 * beta_price', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 5: Market Shares
  {
    id: 'market_shares',
    name: 'Market Shares',
    chapter: 1,
    description: 'Convert fitted utilities into market share percentages.',
    tracer: [
      { text: 'Each product has attributes.', viz: 'mshare_products' },
      { text: 'Multiply attributes by betas.', viz: 'mshare_utilities' },
      { text: 'Softmax gives market shares.', viz: 'mshare_pie' },
    ],
    code: [
      'import numpy as np',
      '',
      'betas = np.array([-0.5, 0.8, 0.6])',
      'products = np.array([',
      '    [10, 4, 1],  # Product A',
      '    [12, 5, 1],  # Product B',
      '    [8,  3, 0],  # Product C',
      '])',
      '',
      'V = products @ betas',
      'exp_V = np.exp(V)',
      'shares = exp_V / exp_V.sum()',
      '',
      'for i, s in enumerate(shares):',
      '    print(f"Product {chr(65+i)}: {s:.1%}")',
    ],

    xray: {
      pipeline: ['import', 'setup', 'V = X @ beta', 'softmax', 'print'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import NumPy',
          explanation: 'NumPy for matrix multiplication and softmax math.',
          deepDive: 'The @ operator for matrix multiplication is a NumPy feature that makes computing utilities across all products clean and efficient.',
          deeperDive: 'NumPy\'s @ operator (matrix multiply) computes the dot product of each row in products with the betas vector in a single operation. Without NumPy, you would need nested loops: for each product, sum(attribute * beta for each attribute). With 3 products and 3 attributes, that is 9 multiplications and 3 sums. The @ operator does it all at once, and scales to thousands of products effortlessly.',
          options: ['Import NumPy', 'Define products', 'Compute utilities', 'Calculate shares'],
        },
        {
          startLine: 2,
          endLine: 7,
          color: 'XRAY_DATA',
          correctLabel: 'Define betas and product attributes',
          explanation: 'betas = [price, quality, brand]. Each row in products is one option\'s attributes.',
          deepDive: 'Product A costs $10, has quality 4, and brand 1. Product C costs $8, has quality 3, and no brand. The betas weight these attributes -- negative price beta means cheaper is better.',
          deeperDive: 'The products matrix has shape (3, 3) -- 3 products with 3 attributes each. The betas vector has shape (3,) matching the 3 attributes. The matrix multiply products @ betas produces a vector of shape (3,) -- one utility per product. For Product A: V_A = (-0.5)*10 + 0.8*4 + 0.6*1 = -5.0 + 3.2 + 0.6 = -1.2. The negative value is fine -- softmax handles any real number. What matters is the relative differences between utilities, not their absolute values.',
          options: ['Define betas and product attributes', 'Import NumPy', 'Compute softmax', 'Print shares'],
        },
        {
          startLine: 9,
          endLine: 11,
          color: 'XRAY_MODEL',
          correctLabel: 'Compute utilities and softmax shares',
          explanation: 'Matrix multiply gives utilities. Softmax converts to market share percentages.',
          deepDive: 'The @ operator multiplies the product attributes by the betas to get a utility for each product. Then the softmax formula converts those utilities into shares that sum to 100%.',
          deeperDive: 'V = products @ betas computes [V_A, V_B, V_C] in one shot. Then exp_V / exp_V.sum() is the vectorized softmax. This is exactly how real market simulators work -- define the market scenario (products and their attributes), apply the estimated betas, and compute predicted shares. The shares tell you what fraction of consumers would choose each product if these were the only options available. This lets managers answer "what if" questions about pricing, features, and new product introductions.',
          options: ['Compute utilities and softmax shares', 'Define products', 'Import NumPy', 'Display results'],
        },
        {
          startLine: 13,
          endLine: 14,
          color: 'XRAY_PREDICT',
          correctLabel: 'Print share percentages',
          explanation: 'enumerate loops with an index. chr(65+i) converts 0,1,2 to A,B,C.',
          deepDive: 'The loop prints each product\'s predicted market share as a percentage. :.1% formats 0.352 as 35.2%. chr(65) is "A", chr(66) is "B", and so on.',
          deeperDive: 'The :.1% format specifier multiplies by 100 and adds a percent sign with 1 decimal place. So 0.3524 becomes "35.2%". enumerate(shares) yields pairs like (0, 0.35), (1, 0.42), (2, 0.23). chr(65+i) uses ASCII codes to convert the index to a letter: A=65, B=66, C=67. In real applications, you would use actual product names instead of letters, and you might display the results as a bar chart or pie chart for presentations to stakeholders.',
          options: ['Print share percentages', 'Compute softmax', 'Define products', 'Import NumPy'],
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
          code: "betas = np.array([-0.5, 0.8, 0.6])\nproducts = np.array([\n    [10, 4, 1],  # Product A\n    [12, 5, 1],  # Product B\n    [8,  3, 0],  # Product C\n])",
          lines: [2, 3, 4, 5, 6, 7],
        },
        {
          id: 'softmax',
          code: 'V = products @ betas\nexp_V = np.exp(V)\nshares = exp_V / exp_V.sum()',
          lines: [9, 10, 11],
        },
        {
          id: 'print',
          code: 'for i, s in enumerate(shares):\n    print(f"Product {chr(65+i)}: {s:.1%}")',
          lines: [13, 14],
        },
      ],
    },

    rewire: {
      goal: 'Change Product C to have brand = 1',
      targets: [
        {
          line: 6,
          description: 'Give Product C a brand',
          currentCode: '    [8,  3, 0],  # Product C',
          options: [
            { label: '[8, 3, 1]', newCode: '    [8,  3, 1],  # Product C', correct: true },
            { label: '[8, 3, 2]', newCode: '    [8,  3, 2],  # Product C', correct: false },
            { label: '[10, 3, 1]', newCode: '    [10, 3, 1],  # Product C', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 6: The IIA Problem
  {
    id: 'the_iia_problem',
    name: 'The IIA Problem',
    chapter: 1,
    description: 'Understand the Independence of Irrelevant Alternatives assumption.',
    tracer: [
      { text: 'Start with 3 options and their shares.', viz: 'iia_original' },
      { text: 'Remove one option.', viz: 'iia_remove' },
      { text: 'Shares redistribute proportionally (IIA).', viz: 'iia_redistribute' },
    ],
    code: [
      'import numpy as np',
      '',
      'V_all = np.array([2.0, 1.5, 1.0])',
      'shares_all = np.exp(V_all) / np.exp(V_all).sum()',
      'print("Before:", shares_all)',
      '',
      '# Remove option 3 (index 2)',
      'V_remaining = V_all[:2]',
      'shares_new = np.exp(V_remaining) / np.exp(V_remaining).sum()',
      'print("After:", shares_new)',
      '',
      'ratio_before = shares_all[0] / shares_all[1]',
      'ratio_after = shares_new[0] / shares_new[1]',
      'print(f"Ratio: {ratio_before:.3f} -> {ratio_after:.3f}")',
    ],

    xray: {
      pipeline: ['import', 'all options', 'remove', 'IIA ratio'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import NumPy',
          explanation: 'NumPy for array slicing and softmax computation.',
          deepDive: 'Array slicing (V_all[:2]) lets you easily remove an option from the choice set.',
          deeperDive: 'NumPy array slicing V_all[:2] creates a new array containing only the first 2 elements. This is more elegant than manually constructing a new list. The slice notation [start:stop] excludes the stop index, so [:2] gives indices 0 and 1.',
          options: ['Import NumPy', 'Define all options', 'Remove an option', 'Check IIA ratio'],
        },
        {
          startLine: 2,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Compute shares for all 3 options',
          explanation: 'Three options with utilities 2.0, 1.5, and 1.0. Softmax gives initial shares.',
          deepDive: 'The three options start with shares roughly 47%, 30%, and 23%. Option 1 has the highest utility and thus the largest share.',
          deeperDive: 'With V = [2.0, 1.5, 1.0], the softmax gives shares approximately [0.467, 0.307, 0.226]. The ratio of share_0 to share_1 is 0.467/0.307 = 1.522. IIA (Independence of Irrelevant Alternatives) predicts this ratio stays the same regardless of what happens to option 3. This is both a strength (computational simplicity) and a weakness (sometimes unrealistic) of the multinomial logit model.',
          options: ['Compute shares for all 3 options', 'Import NumPy', 'Remove an option', 'Check IIA'],
        },
        {
          startLine: 6,
          endLine: 9,
          color: 'XRAY_MODEL',
          correctLabel: 'Remove option 3 and recompute',
          explanation: 'Slicing to keep only options 1 and 2. Recompute softmax with 2 options.',
          deepDive: 'After removing option 3, the remaining shares are recalculated. In the multinomial logit, the freed-up share is split proportionally between the survivors.',
          deeperDive: 'V_remaining = V_all[:2] keeps only [2.0, 1.5]. The new softmax gives shares approximately [0.622, 0.378]. Notice that option 3\'s old 22.6% share was absorbed by options 1 and 2 in exact proportion to their original shares. This is the IIA property: the relative odds between any two options are unaffected by adding or removing other options. The famous "red bus / blue bus" example shows why this can be problematic: if you add a blue bus that\'s identical to an existing red bus, IIA predicts the car\'s share drops by the same proportion -- unrealistic.',
          options: ['Remove option 3 and recompute', 'Define all options', 'Check ratio', 'Import NumPy'],
        },
        {
          startLine: 11,
          endLine: 13,
          color: 'XRAY_PREDICT',
          correctLabel: 'Verify IIA: ratio is preserved',
          explanation: 'The ratio of option 1 to option 2 shares stays the same before and after removal.',
          deepDive: 'The ratio 1.522 stays exactly 1.522. This is IIA in action: removing option 3 does not change the relative preference between options 1 and 2.',
          deeperDive: 'Mathematically, share_i/share_j = exp(V_i)/exp(V_j) = exp(V_i - V_j), which depends only on the utility difference between i and j -- not on any other option. This is why the ratio is preserved. In practice, IIA is often violated: imagine options are "car", "red bus", "blue bus". Removing "blue bus" should mostly benefit "red bus" (a close substitute), not "car". But IIA says car and red bus gain equally proportionally. Models like Mixed Logit and Nested Logit relax this assumption.',
          options: ['Verify IIA: ratio is preserved', 'Remove option 3', 'Define utilities', 'Compute initial shares'],
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
          id: 'all_options',
          code: "V_all = np.array([2.0, 1.5, 1.0])\nshares_all = np.exp(V_all) / np.exp(V_all).sum()\nprint(\"Before:\", shares_all)",
          lines: [2, 3, 4],
        },
        {
          id: 'remove',
          code: "# Remove option 3 (index 2)\nV_remaining = V_all[:2]\nshares_new = np.exp(V_remaining) / np.exp(V_remaining).sum()\nprint(\"After:\", shares_new)",
          lines: [6, 7, 8, 9],
        },
        {
          id: 'iia_check',
          code: 'ratio_before = shares_all[0] / shares_all[1]\nratio_after = shares_new[0] / shares_new[1]\nprint(f"Ratio: {ratio_before:.3f} -> {ratio_after:.3f}")',
          lines: [11, 12, 13],
        },
      ],
    },

    rewire: {
      goal: 'Remove option 2 (index 1) instead of option 3',
      targets: [
        {
          line: 7,
          description: 'Change which option to remove',
          currentCode: 'V_remaining = V_all[:2]',
          options: [
            { label: 'V_all[[0, 2]]', newCode: 'V_remaining = V_all[[0, 2]]', correct: true },
            { label: 'V_all[1:]', newCode: 'V_remaining = V_all[1:]', correct: false },
            { label: 'V_all[:1]', newCode: 'V_remaining = V_all[:1]', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 3: Simulate Markets
  // ================================================================

  // LESSON 7: Market Simulation
  {
    id: 'market_simulation',
    name: 'Market Simulation',
    chapter: 2,
    description: 'Run a what-if scenario: add a feature and see shares shift.',
    tracer: [
      { text: 'Define the current market.', viz: 'sim_current' },
      { text: 'Add a new feature to one product.', viz: 'sim_whatif' },
      { text: 'Compare before and after shares.', viz: 'sim_compare' },
    ],
    code: [
      'import numpy as np',
      '',
      'betas = np.array([-0.5, 0.8, 0.6])',
      'products = np.array([',
      '    [10, 4, 1],',
      '    [12, 5, 1],',
      '    [8,  3, 0],',
      '])',
      '',
      'V_before = products @ betas',
      'shares_before = np.exp(V_before) / np.exp(V_before).sum()',
      '',
      '# What if Product C adds brand?',
      'products_new = products.copy()',
      'products_new[2, 2] = 1  # brand = 1',
      'V_after = products_new @ betas',
      'shares_after = np.exp(V_after) / np.exp(V_after).sum()',
      '',
      'for i in range(3):',
      '    diff = shares_after[i] - shares_before[i]',
      '    print(f"{chr(65+i)}: {shares_before[i]:.1%} -> {shares_after[i]:.1%} ({diff:+.1%})")',
    ],

    xray: {
      pipeline: ['setup', 'before', 'modify', 'compare'],
      regions: [
        {
          startLine: 0,
          endLine: 7,
          color: 'XRAY_DATA',
          correctLabel: 'Set up market scenario',
          explanation: 'Define betas and product attributes for 3 competing products.',
          deepDive: 'This is the same market from the Market Shares lesson: 3 products with price, quality, and brand attributes. We set up the baseline before making any changes.',
          deeperDive: 'Market simulation starts with a snapshot of the current competitive landscape. The betas represent consumer preferences estimated from survey or transaction data. The products matrix describes each competitor\'s current offering. This baseline is the "status quo" scenario that all what-if analyses will be compared against. Getting accurate betas and product descriptions is crucial -- garbage in, garbage out.',
          options: ['Set up market scenario', 'Compute baseline shares', 'Modify a product', 'Compare results'],
        },
        {
          startLine: 9,
          endLine: 10,
          color: 'XRAY_MODEL',
          correctLabel: 'Compute baseline shares',
          explanation: 'Calculate current market shares before any changes.',
          deepDive: 'These "before" shares are the reference point. Any improvement or price change will be measured against these baseline numbers.',
          deeperDive: 'The baseline shares represent the current market equilibrium. For the given products and betas, V_before = products @ betas computes each product\'s utility, and softmax converts to shares. It is critical to compute and store these before making any modifications, so you can calculate the exact impact of the change (shares_after - shares_before). In real consulting projects, you would validate these baseline shares against actual observed market share data before running simulations.',
          options: ['Compute baseline shares', 'Set up scenario', 'Modify product', 'Print comparison'],
        },
        {
          startLine: 12,
          endLine: 16,
          color: 'XRAY_TRAIN',
          correctLabel: 'Modify Product C and recompute',
          explanation: 'Give Product C a brand (0 -> 1) and recalculate all shares.',
          deepDive: 'The .copy() prevents changing the original. Setting brand to 1 increases Product C\'s utility by 0.6 (= beta_brand * 1). All three shares change because softmax is interconnected.',
          deeperDive: 'products.copy() creates an independent copy -- without it, modifying products_new would also change products, corrupting the baseline. products_new[2, 2] = 1 uses NumPy 2D indexing: row 2 (Product C), column 2 (brand). Adding brand increases C\'s utility by beta_brand * 1 = 0.6 * 1 = 0.6. Since softmax normalizes to sum to 1, C\'s gain comes at the expense of A and B. The beauty of the simulator is you can test any scenario: change prices, add features, remove products -- all without actually implementing the change in the real market.',
          options: ['Modify Product C and recompute', 'Compute baseline', 'Set up scenario', 'Print results'],
        },
        {
          startLine: 18,
          endLine: 20,
          color: 'XRAY_PREDICT',
          correctLabel: 'Print before vs. after comparison',
          explanation: 'Show each product\'s share change with +/- formatting.',
          deepDive: 'The :+.1% format adds a + sign to positive changes and - to negative. You can immediately see who gains and who loses from the modification.',
          deeperDive: 'The f-string format {diff:+.1%} shows the percentage point change with a sign: +3.2% means the product gained 3.2 percentage points of share. This is different from a relative change (percentage change). If a product goes from 20% to 23.2%, that is +3.2 percentage points but a +16% relative increase. Both metrics are useful: percentage points for market reports, relative change for ROI calculations. The zero-sum nature of market shares means the gains and losses must exactly cancel out.',
          options: ['Print before vs. after comparison', 'Modify product', 'Compute baseline', 'Set up scenario'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'setup',
          code: "import numpy as np\n\nbetas = np.array([-0.5, 0.8, 0.6])\nproducts = np.array([\n    [10, 4, 1],\n    [12, 5, 1],\n    [8,  3, 0],\n])",
          lines: [0, 1, 2, 3, 4, 5, 6, 7],
        },
        {
          id: 'before',
          code: 'V_before = products @ betas\nshares_before = np.exp(V_before) / np.exp(V_before).sum()',
          lines: [9, 10],
        },
        {
          id: 'modify',
          code: "# What if Product C adds brand?\nproducts_new = products.copy()\nproducts_new[2, 2] = 1  # brand = 1\nV_after = products_new @ betas\nshares_after = np.exp(V_after) / np.exp(V_after).sum()",
          lines: [12, 13, 14, 15, 16],
        },
        {
          id: 'compare',
          code: 'for i in range(3):\n    diff = shares_after[i] - shares_before[i]\n    print(f"{chr(65+i)}: {shares_before[i]:.1%} -> {shares_after[i]:.1%} ({diff:+.1%})")',
          lines: [18, 19, 20],
        },
      ],
    },

    rewire: {
      goal: 'Simulate a price cut for Product A ($10 -> $8)',
      targets: [
        {
          line: 14,
          description: 'Change the modification to a price cut',
          currentCode: 'products_new[2, 2] = 1  # brand = 1',
          options: [
            { label: 'products_new[0, 0] = 8', newCode: 'products_new[0, 0] = 8  # price = 8', correct: true },
            { label: 'products_new[0, 1] = 8', newCode: 'products_new[0, 1] = 8  # quality = 8', correct: false },
            { label: 'products_new[2, 0] = 8', newCode: 'products_new[2, 0] = 8  # price = 8', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 8: Optimal Pricing
  {
    id: 'optimal_pricing',
    name: 'Optimal Pricing',
    chapter: 2,
    description: 'Find the price that maximizes revenue using market simulation.',
    tracer: [
      { text: 'Revenue = share x price.', viz: 'opt_revenue' },
      { text: 'Loop over candidate prices.', viz: 'opt_loop' },
      { text: 'Find the price that maximizes revenue.', viz: 'opt_max' },
    ],
    code: [
      'import numpy as np',
      '',
      'betas = np.array([-0.5, 0.8, 0.6])',
      'base_products = np.array([',
      '    [10, 4, 1],',
      '    [12, 5, 1],',
      '    [8,  3, 0],',
      '])',
      '',
      'best_rev = 0',
      'best_price = 0',
      '',
      'for price in np.arange(5, 20, 0.5):',
      '    products = base_products.copy()',
      '    products[0, 0] = price',
      '    V = products @ betas',
      '    shares = np.exp(V) / np.exp(V).sum()',
      '    revenue = shares[0] * price',
      '    if revenue > best_rev:',
      '        best_rev = revenue',
      '        best_price = price',
      '',
      'print(f"Optimal price: ${best_price:.1f}")',
      'print(f"Max revenue index: {best_rev:.3f}")',
    ],

    xray: {
      pipeline: ['setup', 'loop', 'revenue', 'best'],
      regions: [
        {
          startLine: 0,
          endLine: 7,
          color: 'XRAY_DATA',
          correctLabel: 'Set up market and initial best',
          explanation: 'Define betas, products, and tracking variables for the best price found.',
          deepDive: 'We set up the market scenario and initialize best_rev and best_price to zero. The search will update these whenever a better price is found.',
          deeperDive: 'This is a grid search optimization: try every candidate price and keep track of the best one. best_rev = 0 and best_price = 0 are initial placeholders. We use base_products (not products) as the template to ensure each iteration starts from the same baseline. The .copy() inside the loop creates a fresh copy each time so modifications from one iteration do not leak into the next.',
          options: ['Set up market and initial best', 'Loop over prices', 'Compute revenue', 'Print optimal price'],
        },
        {
          startLine: 12,
          endLine: 17,
          color: 'XRAY_MODEL',
          correctLabel: 'Loop: set price, compute share and revenue',
          explanation: 'For each candidate price, compute Product A\'s market share and revenue index.',
          deepDive: 'np.arange(5, 20, 0.5) tries prices from $5 to $19.50 in $0.50 steps. For each, we compute the market share and multiply by price to get a revenue index.',
          deeperDive: 'Revenue index = share * price captures the fundamental pricing trade-off: raising price increases revenue per unit but decreases market share (because beta_price is negative). At very low prices, you get high share but low revenue per unit. At very high prices, you get high revenue per unit but almost no share. The optimal price balances these forces. This is a simplified version -- real revenue also depends on market size and costs: profit = (price - cost) * market_size * share. np.arange(5, 20, 0.5) generates 30 candidate prices, giving a reasonably fine grid.',
          options: ['Loop: set price, compute share and revenue', 'Set up market', 'Track best result', 'Print optimal'],
        },
        {
          startLine: 18,
          endLine: 20,
          color: 'XRAY_TRAIN',
          correctLabel: 'Track the best price found',
          explanation: 'If current revenue beats the best so far, update best_rev and best_price.',
          deepDive: 'This is a simple argmax pattern: compare each candidate to the current best and keep the winner. By the end of the loop, best_price holds the optimal price.',
          deeperDive: 'The if revenue > best_rev pattern is the standard way to find a maximum in a sequential scan. An alternative is to store all (price, revenue) pairs in a list and use max() at the end, but the running-maximum approach uses less memory. In a more sophisticated analysis, you might use scipy.optimize.minimize (with negative revenue as the objective) for continuous optimization instead of a grid search. But for simple problems with one variable, grid search is perfectly adequate and easy to understand.',
          options: ['Track the best price found', 'Compute revenue', 'Set up market', 'Print results'],
        },
        {
          startLine: 22,
          endLine: 23,
          color: 'XRAY_PREDICT',
          correctLabel: 'Print the optimal price and revenue',
          explanation: 'Display the best price and its corresponding revenue index.',
          deepDive: 'The optimal price balances share loss against price gain. Going higher would lose too many customers; going lower would leave money on the table.',
          deeperDive: 'The revenue index is not actual dollar revenue -- it is a proportional index based on market share. To get actual revenue, multiply by market size: if there are 10,000 potential customers, revenue = share * price * 10,000. The :.1f format shows one decimal place (e.g., $8.5), and :.3f shows three decimals for the revenue index. In practice, you would also plot revenue vs. price to visualize the revenue curve and see how flat or peaked it is around the optimum.',
          options: ['Print the optimal price and revenue', 'Track best price', 'Loop over prices', 'Set up market'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'setup',
          code: "import numpy as np\n\nbetas = np.array([-0.5, 0.8, 0.6])\nbase_products = np.array([\n    [10, 4, 1],\n    [12, 5, 1],\n    [8,  3, 0],\n])",
          lines: [0, 1, 2, 3, 4, 5, 6, 7],
        },
        {
          id: 'init',
          code: 'best_rev = 0\nbest_price = 0',
          lines: [9, 10],
        },
        {
          id: 'loop',
          code: 'for price in np.arange(5, 20, 0.5):\n    products = base_products.copy()\n    products[0, 0] = price\n    V = products @ betas\n    shares = np.exp(V) / np.exp(V).sum()\n    revenue = shares[0] * price',
          lines: [12, 13, 14, 15, 16, 17],
        },
        {
          id: 'track',
          code: '    if revenue > best_rev:\n        best_rev = revenue\n        best_price = price',
          lines: [18, 19, 20],
        },
        {
          id: 'print',
          code: 'print(f"Optimal price: ${best_price:.1f}")\nprint(f"Max revenue index: {best_rev:.3f}")',
          lines: [22, 23],
        },
      ],
    },

    rewire: {
      goal: 'Search prices from $3 to $25 in $1 steps',
      targets: [
        {
          line: 12,
          description: 'Change the price range and step size',
          currentCode: 'for price in np.arange(5, 20, 0.5):',
          options: [
            { label: 'np.arange(3, 25, 1.0)', newCode: 'for price in np.arange(3, 25, 1.0):', correct: true },
            { label: 'np.arange(5, 25, 0.5)', newCode: 'for price in np.arange(5, 25, 0.5):', correct: false },
            { label: 'np.arange(3, 20, 2.0)', newCode: 'for price in np.arange(3, 20, 2.0):', correct: false },
          ],
        },
      ],
    },
  },
];
