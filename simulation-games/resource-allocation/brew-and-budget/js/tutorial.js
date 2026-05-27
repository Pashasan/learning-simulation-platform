// ============================================================
// TUTORIAL SYSTEM — Month-by-month hints, concept introductions
// ============================================================

import { SIM } from './config.js';

export class Tutorial {
  constructor() {
    this.currentMessage = null;
    this._shown = new Set(); // message keys already shown
  }

  // Called each time we enter budget phase for a new month
  getMessageForPhase(phase, game) {
    if (game.tutorialDismissed) {
      this.currentMessage = null;
      return;
    }

    const month = game.month;
    const key = `${phase}_${month}`;
    if (this._shown.has(key)) { this.currentMessage = null; return; }

    let msg = null;

    if (phase === 'budget') {
      msg = this._getBudgetMessage(month, game);
    } else if (phase === 'simulating' && month === 0) {
      msg = 'Watch the customers walking into your cafe! Your marketing budget drives foot traffic. The simulation runs 30 days — watch the daily numbers.';
    } else if (phase === 'analytics') {
      msg = this._getAnalyticsMessage(month, game);
    }

    if (msg) {
      this._shown.add(key);
      this.currentMessage = msg;
    } else {
      this.currentMessage = null;
    }
  }

  _getBudgetMessage(month, game) {
    if (month === 0) {
      return 'Welcome to Brew & Budget! You run this cafe. Each month, allocate your marketing budget across 3 channels to maximize revenue. Drag the sliders or use +/- buttons. Start with a balanced allocation to see how each channel performs.';
    }
    if (month === 1) {
      return 'Month 2! Look at last month\'s results in the analytics tab. Try changing your allocation — experimentation reveals which channels really work.';
    }
    if (month === 2) {
      return 'Channel B probably showed quick results. But did Channel A do anything yet? Some marketing investments take time to build momentum. Keep watching.';
    }
    if (month === 3) {
      const events = game.sim.getEventsForMonth(3);
      if (events.length > 0) {
        return `The ${events[0].name} is happening this month! Events boost organic foot traffic. Notice how Channel C\'s "impressions" also go up during events. Coincidence? Consider investing in analytics to investigate.`;
      }
    }
    if (month === 4) {
      return 'Tip: If you haven\'t already, consider unlocking Tier 1 analytics. Scatter plots and correlations will help you see patterns in your data.';
    }
    if (month === 5 && game.analytics.tier < 2) {
      return 'Halfway through the year! Tier 2 analytics lets you run regressions with event controls — this can reveal whether Channel C actually drives customers or just correlates with events.';
    }
    if (month === 6 && game.analytics.tier >= 2) {
      return 'Pro tip: In the Regression tab, try toggling "Control for Events" and watch what happens to Channel C\'s coefficient. If it drops to near zero, that channel isn\'t actually driving customers.';
    }
    if (month === 7) {
      return 'Expert move: Set one channel to $0 this month. A natural experiment is the gold standard for proving cause and effect. If revenue doesn\'t drop, the channel wasn\'t helping!';
    }
    if (month === 9) {
      return 'Two months left! You\'ve built insight by now. Focus your remaining budget on channels with proven returns. Channel A\'s compounding effect should be strong by now.';
    }
    if (month === 11) {
      return 'Last month! Make it count. After this, you\'ll see the full truth about how each channel really worked.';
    }
    return null;
  }

  _getAnalyticsMessage(month, game) {
    if (month === 0) {
      return 'Here\'s your first month of data. The Overview tab shows revenue. Over time, you\'ll unlock more powerful analytics tools. Patterns will emerge as you collect more months of data.';
    }
    if (month === 2 && game.analytics.tier >= 1) {
      return 'Check the Channels tab! Scatter plots show each channel\'s spend vs. customers. Notice the correlation values (r). But remember: correlation does NOT prove causation!';
    }
    if (month === 4 && game.analytics.tier >= 2 && !game.controlEvents) {
      return 'Your Tier 2 analyst can control for external factors! Go to the Regression tab and toggle "Control for Events" — see if Channel C\'s effect survives.';
    }
    return null;
  }

  dismiss() {
    this.currentMessage = null;
  }

  // Get tooltip text for various data elements
  static tooltip(element) {
    const tips = {
      'correlation': 'Correlation measures how two things move together (-1 to +1). But correlation does NOT prove one causes the other!',
      'r_squared': 'R-squared: how much of the variation your model explains. 0.75 = 75% explained.',
      'adstock': 'Adstock measures accumulated marketing impact. Yesterday\'s ads still affect today, like word-of-mouth spreading.',
      'hill_function': 'Diminishing returns: each additional dollar of spend has less impact than the last.',
      'confounding': 'A confounding variable causes both X and Y to move together, creating a fake correlation between them.',
      'regression': 'Regression estimates how much each factor contributes to the outcome, controlling for other factors.',
      'channel_a': 'Discovery marketing builds brand awareness. Effects are delayed but compound over time.',
      'channel_b': 'Conversion marketing drives immediate traffic. Strong early returns but saturates quickly.',
      'channel_c': 'Social Buzz generates impressions and engagement metrics. But does it cause revenue?',
      'weather': 'Weather affects foot traffic directly. It\'s a known factor — unlike hidden confounders.',
      'events': 'Local events boost organic traffic AND social media activity simultaneously — a classic confounding pattern.',
    };
    return tips[element] || '';
  }
}
