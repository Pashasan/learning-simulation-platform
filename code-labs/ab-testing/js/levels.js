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
    description: 'Load the Expedia hotel experiment data and take your first look.',
    tracer: [
      { text: 'pandas reads data from files.', viz: 'load_pandas' },
      { text: 'shape tells you rows and columns.', viz: 'load_shape' },
      { text: 'head() shows the first few rows.', viz: 'load_head' },
    ],
    code: [
      'import pandas as pd',
      '',
      "df = pd.read_csv('expedia_ab.csv')",
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
          deeperDive: 'pandas is built on top of NumPy and provides two main data structures: Series (1D) and DataFrame (2D). A DataFrame is essentially a dictionary of Series that share the same index. When you import pandas as pd, you get access to hundreds of functions for reading files (read_csv, read_excel, read_json), manipulating data (merge, groupby, pivot_table), and computing statistics (describe, corr, value_counts).',
          options: ['Import library', 'Load the data', 'Inspect the data', 'Plot the data'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Load the data',
          explanation: 'read_csv reads a CSV file into a DataFrame. shape returns (rows, columns).',
          deepDive: 'read_csv turns a comma-separated file into a table you can work with. shape is like checking the dimensions of a spreadsheet -- "5000 rows by 6 columns" for example.',
          deeperDive: 'pd.read_csv() is the most commonly used pandas function. It auto-detects column types, handles headers, and can parse dates. The shape attribute returns a tuple like (5000, 6), meaning 5000 observations and 6 variables. For A/B test data, each row is typically one user session and columns include the treatment group assignment and outcome metrics.',
          options: ['Load the data', 'Import library', 'Inspect the data', 'Clean the data'],
        },
        {
          startLine: 4,
          endLine: 4,
          color: 'XRAY_PREDICT',
          correctLabel: 'Inspect the data',
          explanation: 'head() shows the first 5 rows so you can see what the data looks like.',
          deepDive: 'head() is like peeking at the top of a spreadsheet. It shows the first 5 rows by default, giving you a quick sense of what columns exist and what values look like.',
          deeperDive: 'For A/B test data, inspecting head() reveals the key columns: treatment indicator (random_bool), outcome variable (click), and any covariates (position, price). Always check that your treatment column is binary and your outcome is in the expected format before running any tests.',
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
          code: "df = pd.read_csv('expedia_ab.csv')\nprint(df.shape)",
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
      goal: "Load 'netflix_ab.csv' instead and show dataset info",
      targets: [
        {
          line: 2,
          description: 'Change the file name',
          currentCode: "df = pd.read_csv('expedia_ab.csv')",
          options: [
            { label: "read_csv('netflix_ab.csv')", newCode: "df = pd.read_csv('netflix_ab.csv')", correct: true },
            { label: "read_csv('data.csv')", newCode: "df = pd.read_csv('data.csv')", correct: false },
            { label: "read_excel('netflix.xlsx')", newCode: "df = pd.read_excel('netflix.xlsx')", correct: false },
          ],
        },
        {
          line: 4,
          description: 'Show dataset info instead of head',
          currentCode: 'print(df.head())',
          options: [
            { label: 'df.info()', newCode: 'print(df.info())', correct: true },
            { label: 'df.head(10)', newCode: 'print(df.head(10))', correct: false },
            { label: 'df.sample()', newCode: 'print(df.sample())', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 2: Click Rates
  {
    id: 'click_rates',
    name: 'Click Rates',
    chapter: 0,
    description: 'Compute click-through rates by treatment group.',
    tracer: [
      { text: 'groupby splits data into groups.', viz: 'click_groupby' },
      { text: 'mean() computes the average per group.', viz: 'click_mean' },
      { text: 'A bar chart compares the groups visually.', viz: 'click_bar' },
    ],
    code: [
      'import matplotlib.pyplot as plt',
      '',
      "rates = df.groupby('random_bool')['click'].mean()",
      'print(rates)',
      '',
      'rates.plot(kind="bar")',
      "plt.ylabel('Click Rate')",
      "plt.title('Click Rate by Group')",
      'plt.show()',
    ],

    xray: {
      pipeline: ['pyplot', 'groupby', 'visualize'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import plotting',
          explanation: 'matplotlib.pyplot is the standard plotting library.',
          deepDive: 'pyplot is a collection of functions for creating charts. The "as plt" alias is standard practice in the Python data science community.',
          deeperDive: 'matplotlib is the foundational plotting library in Python, and pyplot is its state-based interface. For A/B tests, visualization helps you quickly spot whether there is a meaningful difference between treatment and control groups before running formal statistical tests.',
          options: ['Import plotting', 'Compute rates', 'Create chart', 'Show results'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Compute rates',
          explanation: 'groupby splits by treatment, then mean() gives the click rate per group.',
          deepDive: 'groupby("random_bool") creates two groups: treatment (True) and control (False). Calling .mean() on the "click" column gives the average click rate for each group -- this is the key comparison in any A/B test.',
          deeperDive: 'The groupby-mean pattern is the simplest way to compute treatment effects. For binary outcomes like clicks, the mean equals the proportion (click rate). If control has 0.25 and treatment has 0.28, the difference (0.03) is the raw treatment effect. But is this difference statistically significant? That requires formal testing, which comes in later lessons.',
          options: ['Compute rates', 'Import plotting', 'Create chart', 'Filter data'],
        },
        {
          startLine: 5,
          endLine: 8,
          color: 'XRAY_PREDICT',
          correctLabel: 'Create chart',
          explanation: 'A bar chart makes the difference between groups easy to see.',
          deepDive: 'plot(kind="bar") creates a bar chart directly from the Series. Adding ylabel and title makes the chart self-explanatory. Visual comparison is always the first step before statistical testing.',
          deeperDive: 'Bar charts are the standard visualization for comparing proportions across groups. For A/B tests, the visual difference between bars gives an intuitive sense of the effect size. But beware of misleading y-axis scales -- a tiny difference can look huge if the axis does not start at zero. Always check the actual numbers alongside the chart.',
          options: ['Create chart', 'Import plotting', 'Compute rates', 'Save results'],
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
          id: 'rates',
          code: "rates = df.groupby('random_bool')['click'].mean()\nprint(rates)",
          lines: [2, 3],
        },
        {
          id: 'chart',
          code: 'rates.plot(kind="bar")\nplt.ylabel(\'Click Rate\')\nplt.title(\'Click Rate by Group\')\nplt.show()',
          lines: [5, 6, 7, 8],
        },
      ],
    },

    rewire: {
      goal: "Compare booking rates instead of click rates",
      targets: [
        {
          line: 2,
          description: 'Change outcome variable',
          currentCode: "rates = df.groupby('random_bool')['click'].mean()",
          options: [
            { label: "['booking'].mean()", newCode: "rates = df.groupby('random_bool')['booking'].mean()", correct: true },
            { label: "['click'].sum()", newCode: "rates = df.groupby('random_bool')['click'].sum()", correct: false },
            { label: "['price'].mean()", newCode: "rates = df.groupby('random_bool')['price'].mean()", correct: false },
          ],
        },
        {
          line: 6,
          description: 'Update the y-axis label',
          currentCode: "plt.ylabel('Click Rate')",
          options: [
            { label: "'Booking Rate'", newCode: "plt.ylabel('Booking Rate')", correct: true },
            { label: "'Count'", newCode: "plt.ylabel('Count')", correct: false },
            { label: "'Revenue'", newCode: "plt.ylabel('Revenue')", correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 3: Randomization Check
  {
    id: 'randomization_check',
    name: 'Randomization Check',
    chapter: 0,
    description: 'Verify that treatment and control groups are balanced.',
    tracer: [
      { text: 'groupby compares covariates across groups.', viz: 'rand_compare' },
      { text: 'Similar means suggest good randomization.', viz: 'rand_balance' },
      { text: 'A t-test formally checks for differences.', viz: 'rand_ttest' },
    ],
    code: [
      'from scipy import stats',
      '',
      "balance = df.groupby('random_bool')['price'].mean()",
      'print(balance)',
      '',
      "ctrl = df[df['random_bool'] == False]['price']",
      "treat = df[df['random_bool'] == True]['price']",
      'stat, pval = stats.ttest_ind(ctrl, treat)',
      "print(f'p-value: {pval:.3f}')",
    ],

    xray: {
      pipeline: ['scipy', 'compare', 'test'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import stats',
          explanation: 'scipy.stats provides statistical test functions.',
          deepDive: 'scipy is the scientific Python library. Its stats module has t-tests, chi-square tests, and many other hypothesis tests.',
          deeperDive: 'scipy.stats contains over 100 probability distributions and dozens of statistical tests. For A/B testing, the most relevant functions are ttest_ind (comparing means), chi2_contingency (comparing proportions), and mannwhitneyu (non-parametric alternative). The stats module follows a consistent API: most tests return a test statistic and a p-value.',
          options: ['Import stats', 'Compare groups', 'Run t-test', 'Plot results'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Compare groups',
          explanation: 'Compares average price across treatment and control groups.',
          deepDive: 'A randomization check verifies that the groups are comparable on observed characteristics. If average price is similar in both groups, that is evidence the random assignment worked.',
          deeperDive: 'Randomization checks (also called balance checks) are standard practice in A/B testing. You compare covariates (like price, position, user characteristics) across treatment and control. If randomization worked, these should be roughly equal. A significant difference suggests a problem with the randomization process. Check multiple covariates to be thorough.',
          options: ['Compare groups', 'Import stats', 'Run t-test', 'Filter data'],
        },
        {
          startLine: 5,
          endLine: 8,
          color: 'XRAY_MODEL',
          correctLabel: 'Run t-test',
          explanation: 'A t-test checks whether the price difference is statistically significant.',
          deepDive: 'We split the data into control and treatment subsets, then run a two-sample t-test. A high p-value (like 0.45) means no significant difference -- good news for randomization!',
          deeperDive: 'ttest_ind performs an independent two-sample t-test, testing H0: mean(ctrl) = mean(treat). A p-value above 0.05 means we cannot reject the null of equal means, which is what we want for a balance check. Note: failing to reject does not prove equality -- it just means we have no evidence of imbalance. For A/B tests with thousands of users, even small true differences would be detected, so a high p-value is reassuring.',
          options: ['Run t-test', 'Compare groups', 'Import stats', 'Create chart'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'from scipy import stats',
          lines: [0],
        },
        {
          id: 'compare',
          code: "balance = df.groupby('random_bool')['price'].mean()\nprint(balance)",
          lines: [2, 3],
        },
        {
          id: 'test',
          code: "ctrl = df[df['random_bool'] == False]['price']\ntreat = df[df['random_bool'] == True]['price']\nstat, pval = stats.ttest_ind(ctrl, treat)\nprint(f'p-value: {pval:.3f}')",
          lines: [5, 6, 7, 8],
        },
      ],
    },

    rewire: {
      goal: "Check balance on 'position' instead of price",
      targets: [
        {
          line: 2,
          description: 'Change the covariate',
          currentCode: "balance = df.groupby('random_bool')['price'].mean()",
          options: [
            { label: "['position'].mean()", newCode: "balance = df.groupby('random_bool')['position'].mean()", correct: true },
            { label: "['click'].mean()", newCode: "balance = df.groupby('random_bool')['click'].mean()", correct: false },
            { label: "['price'].median()", newCode: "balance = df.groupby('random_bool')['price'].median()", correct: false },
          ],
        },
        {
          line: 5,
          description: 'Update the filter column',
          currentCode: "ctrl = df[df['random_bool'] == False]['price']",
          options: [
            { label: "['position']", newCode: "ctrl = df[df['random_bool'] == False]['position']", correct: true },
            { label: "['click']", newCode: "ctrl = df[df['random_bool'] == False]['click']", correct: false },
            { label: "['booking']", newCode: "ctrl = df[df['random_bool'] == False]['booking']", correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 2: Test It
  // ================================================================

  // LESSON 4: Contingency Table
  {
    id: 'contingency_table',
    name: 'Contingency Table',
    chapter: 1,
    description: 'Build a cross-tabulation of treatment vs outcome.',
    tracer: [
      { text: 'crosstab counts combinations of two variables.', viz: 'ctab_concept' },
      { text: 'Rows are treatment groups, columns are outcomes.', viz: 'ctab_structure' },
      { text: 'Expected counts show what we would see if there were no effect.', viz: 'ctab_expected' },
    ],
    code: [
      'import pandas as pd',
      '',
      "table = pd.crosstab(df['random_bool'], df['click'])",
      'print(table)',
      '',
      '# Expected counts under null hypothesis',
      'total = table.sum().sum()',
      'row_totals = table.sum(axis=1)',
      'col_totals = table.sum(axis=0)',
    ],

    xray: {
      pipeline: ['pandas', 'crosstab', 'expected'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import library',
          explanation: 'pandas provides the crosstab function.',
          deepDive: 'We already imported pandas earlier, but each lesson is self-contained. pd.crosstab is the go-to function for creating contingency tables.',
          deeperDive: 'pd.crosstab computes a cross-tabulation of two or more factors. By default it counts occurrences, but you can pass aggfunc and values parameters to compute other statistics. For A/B testing, the most common use is counting treatment-vs-outcome combinations to prepare for a chi-square test.',
          options: ['Import library', 'Build table', 'Compute expected', 'Run test'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Build table',
          explanation: 'crosstab creates a 2x2 table of treatment group vs click outcome.',
          deepDive: 'The contingency table shows how many users in each group (treatment/control) clicked vs did not click. This 2x2 format is the input for a chi-square test of independence.',
          deeperDive: 'A contingency table is the foundation of chi-square testing. For a 2x2 table with treatment (T/C) and outcome (click/no-click), you get four cells. The chi-square test compares these observed counts to what you would expect if treatment had no effect. Large deviations from expected counts lead to a small p-value, suggesting the treatment matters.',
          options: ['Build table', 'Import library', 'Compute expected', 'Visualize data'],
        },
        {
          startLine: 5,
          endLine: 8,
          color: 'XRAY_MODEL',
          correctLabel: 'Compute expected',
          explanation: 'Expected counts are what we would observe if treatment had no effect.',
          deepDive: 'Under the null hypothesis (no treatment effect), the expected count for each cell is (row total * column total) / grand total. Comparing observed vs expected is what the chi-square test does.',
          deeperDive: 'Expected frequencies under independence: E_ij = (R_i * C_j) / N, where R_i is the row total, C_j is the column total, and N is the grand total. If observed counts differ substantially from expected counts, we reject the null hypothesis of independence. The chi-square statistic quantifies this: chi2 = sum((O - E)^2 / E). Computing these manually builds intuition for what the test is doing.',
          options: ['Compute expected', 'Build table', 'Import library', 'Run chi-square'],
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
          id: 'table',
          code: "table = pd.crosstab(df['random_bool'], df['click'])\nprint(table)",
          lines: [2, 3],
        },
        {
          id: 'expected',
          code: "# Expected counts under null hypothesis\ntotal = table.sum().sum()\nrow_totals = table.sum(axis=1)\ncol_totals = table.sum(axis=0)",
          lines: [5, 6, 7, 8],
        },
      ],
    },

    rewire: {
      goal: "Cross-tabulate treatment with 'booking' instead of click",
      targets: [
        {
          line: 2,
          description: 'Change the outcome column',
          currentCode: "table = pd.crosstab(df['random_bool'], df['click'])",
          options: [
            { label: "df['booking']", newCode: "table = pd.crosstab(df['random_bool'], df['booking'])", correct: true },
            { label: "df['price']", newCode: "table = pd.crosstab(df['random_bool'], df['price'])", correct: false },
            { label: "df['position']", newCode: "table = pd.crosstab(df['random_bool'], df['position'])", correct: false },
          ],
        },
        {
          line: 5,
          description: 'Update the comment',
          currentCode: '# Expected counts under null hypothesis',
          options: [
            { label: '# Expected booking counts', newCode: '# Expected booking counts under null hypothesis', correct: true },
            { label: '# Observed counts', newCode: '# Observed counts', correct: false },
            { label: '# Chi-square inputs', newCode: '# Chi-square inputs', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 5: Chi-Square Test
  {
    id: 'chi_square_test',
    name: 'Chi-Square Test',
    chapter: 1,
    description: 'Test whether thumbnail placement significantly affects clicks.',
    tracer: [
      { text: 'chi2_contingency runs the chi-square test.', viz: 'chi2_concept' },
      { text: 'It returns a test statistic and p-value.', viz: 'chi2_output' },
      { text: 'Small p-value means the treatment likely has an effect.', viz: 'chi2_interpret' },
    ],
    code: [
      'from scipy.stats import chi2_contingency',
      '',
      "table = pd.crosstab(df['random_bool'], df['click'])",
      'chi2, pval, dof, expected = chi2_contingency(table)',
      '',
      "print(f'Chi-square statistic: {chi2:.2f}')",
      "print(f'p-value: {pval:.4f}')",
      "print(f'Degrees of freedom: {dof}')",
    ],

    xray: {
      pipeline: ['scipy', 'crosstab', 'test'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import test',
          explanation: 'chi2_contingency is the function for testing independence in a contingency table.',
          deepDive: 'We import directly from scipy.stats to get the chi2_contingency function. This tests whether two categorical variables are independent.',
          deeperDive: 'chi2_contingency implements Pearson\'s chi-squared test of independence. It takes a contingency table as input and computes the expected frequencies internally, then calculates the test statistic as sum((observed - expected)^2 / expected). The function returns four values: the chi-square statistic, the p-value, degrees of freedom, and the expected frequencies matrix.',
          options: ['Import test', 'Build table', 'Run test', 'Print results'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_DATA',
          correctLabel: 'Run test',
          explanation: 'Build the contingency table and pass it to chi2_contingency.',
          deepDive: 'chi2_contingency returns four values: the chi-square statistic, p-value, degrees of freedom, and expected frequencies. We unpack all four with tuple assignment.',
          deeperDive: 'The chi-square test is appropriate for testing independence between two categorical variables. For a 2x2 table, degrees of freedom = (rows-1) * (cols-1) = 1. The p-value comes from the chi-square distribution with dof degrees of freedom. A common threshold is p < 0.05 for "statistical significance," but always consider effect size alongside p-values.',
          options: ['Run test', 'Import test', 'Build table', 'Interpret results'],
        },
        {
          startLine: 5,
          endLine: 7,
          color: 'XRAY_PREDICT',
          correctLabel: 'Print results',
          explanation: 'Display the test statistic, p-value, and degrees of freedom.',
          deepDive: 'The chi-square statistic measures how far observed counts deviate from expected. The p-value tells you the probability of seeing such a deviation by chance. dof = 1 for a 2x2 table.',
          deeperDive: 'Interpreting chi-square results: chi2 = 8.95, p = 0.003 means there is only a 0.3% chance of observing this much difference between groups if the treatment had no effect. With p < 0.05, we reject the null hypothesis of no treatment effect. The degrees of freedom (dof) determines which chi-square distribution to use -- for a 2x2 table it is always 1. Report all three values in your analysis.',
          options: ['Print results', 'Run test', 'Import test', 'Plot distribution'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'import',
          code: 'from scipy.stats import chi2_contingency',
          lines: [0],
        },
        {
          id: 'test',
          code: "table = pd.crosstab(df['random_bool'], df['click'])\nchi2, pval, dof, expected = chi2_contingency(table)",
          lines: [2, 3],
        },
        {
          id: 'print',
          code: "print(f'Chi-square statistic: {chi2:.2f}')\nprint(f'p-value: {pval:.4f}')\nprint(f'Degrees of freedom: {dof}')",
          lines: [5, 6, 7],
        },
      ],
    },

    rewire: {
      goal: "Test booking outcome and use 0.01 significance level",
      targets: [
        {
          line: 2,
          description: 'Change outcome to booking',
          currentCode: "table = pd.crosstab(df['random_bool'], df['click'])",
          options: [
            { label: "df['booking']", newCode: "table = pd.crosstab(df['random_bool'], df['booking'])", correct: true },
            { label: "df['revenue']", newCode: "table = pd.crosstab(df['random_bool'], df['revenue'])", correct: false },
            { label: "df['position']", newCode: "table = pd.crosstab(df['random_bool'], df['position'])", correct: false },
          ],
        },
        {
          line: 6,
          description: 'Show more decimal places for small p-values',
          currentCode: "print(f'p-value: {pval:.4f}')",
          options: [
            { label: '{pval:.6f}', newCode: "print(f'p-value: {pval:.6f}')", correct: true },
            { label: '{pval:.1f}', newCode: "print(f'p-value: {pval:.1f}')", correct: false },
            { label: '{pval}', newCode: "print(f'p-value: {pval}')", correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 6: Logistic Regression
  {
    id: 'logistic_regression',
    name: 'Logistic Regression',
    chapter: 1,
    description: 'Model the treatment effect using logistic regression.',
    tracer: [
      { text: 'statsmodels fits regression models.', viz: 'logit_concept' },
      { text: 'Logit models binary outcomes (click or not).', viz: 'logit_curve' },
      { text: 'The coefficient gives the log-odds ratio.', viz: 'logit_coef' },
    ],
    code: [
      'import statsmodels.api as sm',
      '',
      "X = df[['random_bool']].astype(int)",
      'X = sm.add_constant(X)',
      "y = df['click']",
      '',
      'model = sm.Logit(y, X).fit(disp=0)',
      'print(model.summary().tables[1])',
    ],

    xray: {
      pipeline: ['statsmodels', 'prepare', 'fit'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import statsmodels',
          explanation: 'statsmodels provides regression models including logistic regression.',
          deepDive: 'statsmodels.api gives you access to Logit, OLS, and other regression models. Unlike sklearn, statsmodels focuses on statistical inference -- it gives you p-values, confidence intervals, and summary tables.',
          deeperDive: 'statsmodels is the go-to Python library for econometric and statistical modeling. It follows the R-style approach where you care about coefficient estimates, standard errors, and p-values -- not just prediction accuracy. For A/B testing, this is exactly what you need: you want to know whether the treatment coefficient is statistically significant and what the effect size is.',
          options: ['Import statsmodels', 'Prepare data', 'Fit model', 'Show results'],
        },
        {
          startLine: 2,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Prepare data',
          explanation: 'Convert treatment to integer, add constant for intercept, define outcome.',
          deepDive: 'astype(int) converts True/False to 1/0. add_constant adds a column of 1s for the intercept term. y is the binary outcome we want to model.',
          deeperDive: 'In statsmodels, you must explicitly add a constant term (intercept) to your feature matrix using sm.add_constant(). This differs from sklearn which includes it automatically. The treatment variable must be numeric (0/1), which astype(int) ensures. The resulting X matrix has two columns: a constant (1s) and the treatment indicator.',
          options: ['Prepare data', 'Import statsmodels', 'Fit model', 'Compute odds'],
        },
        {
          startLine: 6,
          endLine: 7,
          color: 'XRAY_MODEL',
          correctLabel: 'Fit model',
          explanation: 'Fit the logistic regression and print the coefficient table.',
          deepDive: 'sm.Logit(y, X).fit() estimates the logistic regression. disp=0 suppresses iteration output. The summary table shows coefficients, standard errors, z-statistics, and p-values.',
          deeperDive: 'The Logit model estimates: log(p/(1-p)) = b0 + b1*treatment. The coefficient b1 is the log-odds ratio -- exp(b1) gives the odds ratio. If b1 = 0.15, then exp(0.15) = 1.16, meaning treatment increases the odds of clicking by 16%. The p-value for b1 tests H0: b1 = 0, i.e., no treatment effect. This is equivalent to the chi-square test for a single binary predictor, but logistic regression allows you to add controls.',
          options: ['Fit model', 'Prepare data', 'Import statsmodels', 'Make predictions'],
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
          id: 'prepare',
          code: "X = df[['random_bool']].astype(int)\nX = sm.add_constant(X)\ny = df['click']",
          lines: [2, 3, 4],
        },
        {
          id: 'fit',
          code: "model = sm.Logit(y, X).fit(disp=0)\nprint(model.summary().tables[1])",
          lines: [6, 7],
        },
      ],
    },

    rewire: {
      goal: "Print the odds ratio instead of the raw summary",
      targets: [
        {
          line: 7,
          description: 'Show odds ratios instead of log-odds',
          currentCode: 'print(model.summary().tables[1])',
          options: [
            { label: 'np.exp(model.params)', newCode: 'print(np.exp(model.params))', correct: true },
            { label: 'model.predict(X)', newCode: 'print(model.predict(X))', correct: false },
            { label: 'model.resid_pearson', newCode: 'print(model.resid_pearson)', correct: false },
          ],
        },
        {
          line: 6,
          description: 'Show convergence details',
          currentCode: 'model = sm.Logit(y, X).fit(disp=0)',
          options: [
            { label: 'fit(disp=1)', newCode: 'model = sm.Logit(y, X).fit(disp=1)', correct: true },
            { label: 'fit(method="bfgs")', newCode: "model = sm.Logit(y, X).fit(method='bfgs', disp=0)", correct: false },
            { label: 'fit(maxiter=10)', newCode: 'model = sm.Logit(y, X).fit(maxiter=10, disp=0)', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 3: Go Deeper
  // ================================================================

  // LESSON 7: Add Controls
  {
    id: 'add_controls',
    name: 'Add Controls',
    chapter: 2,
    description: 'Include covariates to improve precision and check robustness.',
    tracer: [
      { text: 'Adding controls accounts for other factors.', viz: 'ctrl_concept' },
      { text: 'position_1 is a key covariate here.', viz: 'ctrl_position' },
      { text: 'The treatment effect should remain after adding controls.', viz: 'ctrl_compare' },
    ],
    code: [
      'import statsmodels.api as sm',
      'import numpy as np',
      '',
      "X = df[['random_bool', 'position_1', 'high_price']].astype(int)",
      'X = sm.add_constant(X)',
      "y = df['click']",
      '',
      'model = sm.Logit(y, X).fit(disp=0)',
      'print(model.summary().tables[1])',
    ],

    xray: {
      pipeline: ['imports', 'features', 'model'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'statsmodels for regression, numpy for numerical operations.',
          deepDive: 'We need statsmodels for the Logit model and numpy for computing odds ratios later. Both are standard imports for statistical analysis.',
          deeperDive: 'In A/B testing, controlling for covariates serves two purposes: (1) it increases statistical power by reducing residual variance, and (2) it checks robustness -- if the treatment effect changes dramatically when you add controls, that could indicate a problem with the randomization.',
          options: ['Import libraries', 'Add covariates', 'Fit model', 'Compare models'],
        },
        {
          startLine: 3,
          endLine: 5,
          color: 'XRAY_DATA',
          correctLabel: 'Add covariates',
          explanation: 'Include position and price alongside the treatment indicator.',
          deepDive: 'Now X has three predictors: random_bool (treatment), position_1 (whether the hotel appeared first), and high_price. Adding these controls helps isolate the true treatment effect from confounding variation.',
          deeperDive: 'In the Expedia experiment, position_1 indicates whether a hotel appeared at the top of the search results. This is a powerful predictor of clicks because top-positioned hotels get more visibility. high_price is a binary indicator for expensive hotels. By controlling for these, we account for the fact that clicks depend on position and price, not just the sorting treatment. If the treatment coefficient stays significant after adding controls, that strengthens our causal claim.',
          options: ['Add covariates', 'Import libraries', 'Fit model', 'Select features'],
        },
        {
          startLine: 7,
          endLine: 8,
          color: 'XRAY_MODEL',
          correctLabel: 'Fit model',
          explanation: 'Fit the multiple logistic regression and print the results.',
          deepDive: 'The model now estimates separate effects for treatment, position, and price. The treatment coefficient tells us the effect of the A/B test holding other factors constant.',
          deeperDive: 'With multiple logistic regression: log(p/(1-p)) = b0 + b1*treatment + b2*position_1 + b3*high_price. Now b1 represents the treatment effect controlling for position and price. Compare this b1 to the simple model from Lesson 6. If they are similar, the treatment effect is robust. If b1 changes substantially, it means the covariates were confounding the simple estimate. In a well-randomized experiment, adding controls should not change the treatment coefficient much.',
          options: ['Fit model', 'Add covariates', 'Import libraries', 'Compute odds ratios'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'imports',
          code: 'import statsmodels.api as sm\nimport numpy as np',
          lines: [0, 1],
        },
        {
          id: 'features',
          code: "X = df[['random_bool', 'position_1', 'high_price']].astype(int)\nX = sm.add_constant(X)\ny = df['click']",
          lines: [3, 4, 5],
        },
        {
          id: 'model',
          code: "model = sm.Logit(y, X).fit(disp=0)\nprint(model.summary().tables[1])",
          lines: [7, 8],
        },
      ],
    },

    rewire: {
      goal: "Show odds ratios and add a star_rating control",
      targets: [
        {
          line: 3,
          description: 'Add star_rating as a control variable',
          currentCode: "X = df[['random_bool', 'position_1', 'high_price']].astype(int)",
          options: [
            { label: "Add 'star_rating'", newCode: "X = df[['random_bool', 'position_1', 'high_price', 'star_rating']].astype(float)", correct: true },
            { label: "Remove 'high_price'", newCode: "X = df[['random_bool', 'position_1']].astype(int)", correct: false },
            { label: "Add 'click'", newCode: "X = df[['random_bool', 'position_1', 'high_price', 'click']].astype(int)", correct: false },
          ],
        },
        {
          line: 8,
          description: 'Show odds ratios instead of log-odds',
          currentCode: 'print(model.summary().tables[1])',
          options: [
            { label: 'np.exp(model.params)', newCode: 'print(np.exp(model.params))', correct: true },
            { label: 'model.aic', newCode: 'print(model.aic)', correct: false },
            { label: 'model.prsquared', newCode: 'print(model.prsquared)', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 8: Interaction Effects
  {
    id: 'interaction_effects',
    name: 'Interaction Effects',
    chapter: 2,
    description: 'Test whether the treatment effect varies across segments.',
    tracer: [
      { text: 'An interaction term captures heterogeneous effects.', viz: 'inter_concept' },
      { text: 'treatment * position tests if the effect differs by position.', viz: 'inter_multiply' },
      { text: 'A significant interaction means the effect is not uniform.', viz: 'inter_interpret' },
    ],
    code: [
      'import statsmodels.api as sm',
      'import numpy as np',
      '',
      "df['treat_x_pos'] = df['random_bool'] * df['position_1']",
      "X = df[['random_bool', 'position_1', 'high_price', 'treat_x_pos']].astype(int)",
      'X = sm.add_constant(X)',
      "y = df['click']",
      '',
      'model = sm.Logit(y, X).fit(disp=0)',
      'print(model.summary().tables[1])',
    ],

    xray: {
      pipeline: ['imports', 'interaction', 'model'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Import libraries',
          explanation: 'Standard imports for statistical modeling.',
          deepDive: 'Same imports as before. The new piece is creating an interaction term in the data preparation step.',
          deeperDive: 'Interaction effects are a cornerstone of advanced A/B testing. They answer the question: "Does the treatment work the same for everyone?" In marketing and product experiments, it is common for treatment effects to differ across segments (new vs returning users, mobile vs desktop, high vs low price points).',
          options: ['Import libraries', 'Create interaction', 'Fit model', 'Interpret results'],
        },
        {
          startLine: 3,
          endLine: 6,
          color: 'XRAY_DATA',
          correctLabel: 'Create interaction',
          explanation: 'Multiply treatment by position to create an interaction term.',
          deepDive: 'The interaction term treat_x_pos equals 1 only when both random_bool AND position_1 are 1. This lets the model estimate a different treatment effect for hotels in position 1 vs other positions.',
          deeperDive: 'Creating interaction terms manually (by multiplying columns) is the standard approach in statsmodels. The interaction coefficient captures the additional effect of treatment when the hotel is in position 1. If the main treatment effect is 0.10 and the interaction is -0.05, then the treatment effect for position-1 hotels is only 0.05, while for other hotels it is 0.10. This is heterogeneous treatment effect analysis -- essential for understanding who benefits most from the intervention.',
          options: ['Create interaction', 'Import libraries', 'Fit model', 'Test significance'],
        },
        {
          startLine: 8,
          endLine: 9,
          color: 'XRAY_MODEL',
          correctLabel: 'Fit model',
          explanation: 'Fit the model and check if the interaction term is significant.',
          deepDive: 'Look at the p-value for treat_x_pos in the output. If it is significant (p < 0.05), the treatment effect genuinely differs between position-1 and other hotels.',
          deeperDive: 'Interpreting interaction models: the coefficient for random_bool is now the treatment effect when position_1 = 0 (the "baseline" group). The coefficient for treat_x_pos is the additional treatment effect for position_1 = 1 hotels. The total treatment effect for position-1 hotels is b1 + b4. If b4 is negative and significant, the treatment is less effective for top-positioned hotels (perhaps because they already have high visibility). This nuanced understanding drives better targeting decisions.',
          options: ['Fit model', 'Create interaction', 'Import libraries', 'Compare segments'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'imports',
          code: 'import statsmodels.api as sm\nimport numpy as np',
          lines: [0, 1],
        },
        {
          id: 'interaction',
          code: "df['treat_x_pos'] = df['random_bool'] * df['position_1']\nX = df[['random_bool', 'position_1', 'high_price', 'treat_x_pos']].astype(int)\nX = sm.add_constant(X)\ny = df['click']",
          lines: [3, 4, 5, 6],
        },
        {
          id: 'model',
          code: "model = sm.Logit(y, X).fit(disp=0)\nprint(model.summary().tables[1])",
          lines: [8, 9],
        },
      ],
    },

    rewire: {
      goal: "Test interaction with high_price instead of position",
      targets: [
        {
          line: 3,
          description: 'Create treatment * price interaction',
          currentCode: "df['treat_x_pos'] = df['random_bool'] * df['position_1']",
          options: [
            { label: "random_bool * high_price", newCode: "df['treat_x_price'] = df['random_bool'] * df['high_price']", correct: true },
            { label: "position_1 * high_price", newCode: "df['pos_x_price'] = df['position_1'] * df['high_price']", correct: false },
            { label: "random_bool + position_1", newCode: "df['treat_plus_pos'] = df['random_bool'] + df['position_1']", correct: false },
          ],
        },
        {
          line: 4,
          description: 'Update feature list to use new interaction',
          currentCode: "X = df[['random_bool', 'position_1', 'high_price', 'treat_x_pos']].astype(int)",
          options: [
            { label: "treat_x_price", newCode: "X = df[['random_bool', 'position_1', 'high_price', 'treat_x_price']].astype(int)", correct: true },
            { label: "treat_x_pos (keep old)", newCode: "X = df[['random_bool', 'position_1', 'high_price', 'treat_x_pos']].astype(int)", correct: false },
            { label: "Remove interaction", newCode: "X = df[['random_bool', 'position_1', 'high_price']].astype(int)", correct: false },
          ],
        },
      ],
    },
  },
];
