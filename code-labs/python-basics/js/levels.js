// ============================================================
// LEVELS — 8 Lessons across 3 Chapters with X-Ray / Assemble / Rewire rounds
// ============================================================

export const LEVELS = [
  // ================================================================
  // CHAPTER 1: Basics
  // ================================================================

  // LESSON 1: Variables & Print
  {
    id: 'variables_and_print',
    name: 'Variables & Print',
    chapter: 0,
    description: 'Store values in variables and print them out.',
    tracer: [
      { text: 'A variable is a label for a value.', viz: 'var_assign' },
      { text: 'f-strings embed variables in text.', viz: 'var_fstring' },
      { text: 'print() displays output to the screen.', viz: 'var_print' },
    ],
    code: [
      'name = "Alice"',
      'age = 25',
      'height = 5.6',
      '',
      'greeting = f"Hi, {name}!"',
      'print(greeting)',
      'print(f"{name} is {age} years old")',
    ],

    xray: {
      pipeline: ['assign\nvariables', 'f-string', 'print'],
      regions: [
        {
          startLine: 0,
          endLine: 2,
          color: 'XRAY_DATA',
          correctLabel: 'Assign variables',
          explanation: 'Three variables store a string, an integer, and a float.',
          deepDive: 'Variables are labels that point to values. Python figures out the type automatically -- you do not need to declare it. "Alice" is a string, 25 is an integer, and 5.6 is a float.',
          deeperDive: 'In Python, everything is an object. When you write name = "Alice", Python creates a string object in memory and makes the variable name point to it. Unlike languages like Java or C, you never declare a type -- Python infers it at runtime (this is called dynamic typing). You can check any variable\'s type with type(name), which returns <class \'str\'>. You can even reassign a variable to a completely different type: name = 42 is valid Python, though it is usually bad practice. Variable names must start with a letter or underscore and can contain letters, digits, and underscores.',
          options: ['Assign variables', 'Print output', 'Build a string', 'Define a function'],
        },
        {
          startLine: 4,
          endLine: 4,
          color: 'XRAY_MODEL',
          correctLabel: 'Build an f-string',
          explanation: 'f-strings let you put variables directly inside curly braces in a string.',
          deepDive: 'An f-string starts with the letter f before the quotes. Anything inside {curly braces} gets replaced with the variable\'s value. So f"Hi, {name}!" becomes "Hi, Alice!".',
          deeperDive: 'f-strings (formatted string literals) were introduced in Python 3.6. Before that, developers used .format() like "Hi, {}!".format(name) or the older % operator like "Hi, %s!" % name. f-strings are faster and more readable. You can put any expression inside the braces: f"{2 + 3}" gives "5", f"{name.upper()}" gives "ALICE", and f"{age * 2}" gives "50". You can also add format specifiers: f"{height:.1f}" gives "5.6" with one decimal place, and f"{age:05d}" gives "00025" with zero-padding.',
          options: ['Build an f-string', 'Assign a variable', 'Print output', 'Import a library'],
        },
        {
          startLine: 5,
          endLine: 6,
          color: 'XRAY_PREDICT',
          correctLabel: 'Print to the screen',
          explanation: 'print() displays text to the console. Each call makes a new line.',
          deepDive: 'print() sends text to the console so you can see it. You can pass it a string, a variable, or an f-string. Each print statement starts a new line by default.',
          deeperDive: 'print() is a built-in function that writes to standard output (stdout). By default it adds a newline character at the end, but you can change that with the end parameter: print("Hello", end=" ") prints "Hello " without a newline. You can print multiple items separated by spaces: print(name, age) outputs "Alice 25". The separator can be changed too: print(name, age, sep=", ") outputs "Alice, 25". For debugging, print() is the simplest tool, but for complex programs you might use the logging module instead.',
          options: ['Print to the screen', 'Build an f-string', 'Assign variables', 'Return a value'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'vars',
          code: 'name = "Alice"\nage = 25\nheight = 5.6',
          lines: [0, 1, 2],
        },
        {
          id: 'fstring',
          code: 'greeting = f"Hi, {name}!"',
          lines: [4],
        },
        {
          id: 'prints',
          code: 'print(greeting)\nprint(f"{name} is {age} years old")',
          lines: [5, 6],
        },
      ],
    },

    rewire: {
      goal: 'Change the name to "Bob" and age to 30',
      targets: [
        {
          line: 0,
          description: 'Change the name',
          currentCode: 'name = "Alice"',
          options: [
            { label: '"Bob"', newCode: 'name = "Bob"', correct: true },
            { label: '"alice"', newCode: 'name = "alice"', correct: false },
            { label: '25', newCode: 'name = 25', correct: false },
          ],
        },
        {
          line: 1,
          description: 'Change the age',
          currentCode: 'age = 25',
          options: [
            { label: '30', newCode: 'age = 30', correct: true },
            { label: '"30"', newCode: 'age = "30"', correct: false },
            { label: '25.0', newCode: 'age = 25.0', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 2: Lists
  {
    id: 'lists',
    name: 'Lists',
    chapter: 0,
    description: 'Create ordered collections and modify them.',
    tracer: [
      { text: 'A list holds items in order.', viz: 'list_create' },
      { text: 'append() adds an item to the end.', viz: 'list_append' },
      { text: 'Index with [] to get one item.', viz: 'list_index' },
    ],
    code: [
      'fruits = ["apple", "banana", "cherry"]',
      'print(len(fruits))',
      '',
      'fruits.append("date")',
      'print(fruits)',
      '',
      'first = fruits[0]',
      'last = fruits[-1]',
      'print(first, last)',
    ],

    xray: {
      pipeline: ['create\nlist', 'append', 'index'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_DATA',
          correctLabel: 'Create a list',
          explanation: 'Square brackets create a list. len() counts the items.',
          deepDive: 'A list is like a numbered row of slots. You put items in with square brackets and commas. len() tells you how many items you have -- here it is 3.',
          deeperDive: 'Lists in Python are dynamic arrays -- they can grow and shrink, and hold any mix of types: [1, "hello", 3.14, True] is a valid list. Internally, Python allocates more memory than needed so that append() is fast (amortized O(1)). len() is O(1) because Python stores the count internally. Lists are mutable, meaning you can change them in place. This is different from strings and tuples, which are immutable. You can create an empty list with [] or list(), and check if it is empty with if not my_list: or if len(my_list) == 0:.',
          options: ['Create a list', 'Add an item', 'Get an item by index', 'Sort the list'],
        },
        {
          startLine: 3,
          endLine: 4,
          color: 'XRAY_TRAIN',
          correctLabel: 'Append to the list',
          explanation: 'append() adds one item to the end of the list.',
          deepDive: 'append() sticks a new item at the tail end of the list. After this line, fruits has 4 items instead of 3. It modifies the list in place -- it does not create a new one.',
          deeperDive: 'append() modifies the list in place and returns None, so writing fruits = fruits.append("date") is a common beginner bug -- it sets fruits to None! Other methods that modify lists in place include: insert(i, item) to add at position i, extend([items]) to add multiple items, remove(item) to delete the first occurrence, and pop(i) to remove and return the item at position i. For adding multiple items, use extend() instead of append(), because fruits.append([1, 2]) adds the entire list as a single nested element.',
          options: ['Append to the list', 'Create a list', 'Index an item', 'Print the length'],
        },
        {
          startLine: 6,
          endLine: 8,
          color: 'XRAY_PREDICT',
          correctLabel: 'Index into the list',
          explanation: '[0] gets the first item, [-1] gets the last.',
          deepDive: 'Python lists are zero-indexed, so [0] is the first item (apple). Negative indices count from the end: [-1] is the last item (date), [-2] is the second-to-last.',
          deeperDive: 'Indexing with [i] returns a single element and raises IndexError if i is out of range. Slicing with [start:stop] returns a new list containing elements from start up to (but not including) stop: fruits[1:3] gives ["banana", "cherry"]. You can omit start or stop: fruits[:2] gives the first two, fruits[2:] gives everything from index 2 onward. Slicing never raises IndexError -- it just returns what it can. You can also use a step: fruits[::2] gives every other item, and fruits[::-1] reverses the list.',
          options: ['Index into the list', 'Append to the list', 'Create a list', 'Loop through the list'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'create',
          code: 'fruits = ["apple", "banana", "cherry"]\nprint(len(fruits))',
          lines: [0, 1],
        },
        {
          id: 'append',
          code: 'fruits.append("date")\nprint(fruits)',
          lines: [3, 4],
        },
        {
          id: 'index',
          code: 'first = fruits[0]\nlast = fruits[-1]\nprint(first, last)',
          lines: [6, 7, 8],
        },
      ],
    },

    rewire: {
      goal: 'Start with 4 fruits and get the second item',
      targets: [
        {
          line: 0,
          description: 'Add a fourth fruit to the initial list',
          currentCode: 'fruits = ["apple", "banana", "cherry"]',
          options: [
            { label: '["apple", "banana", "cherry", "date"]', newCode: 'fruits = ["apple", "banana", "cherry", "date"]', correct: true },
            { label: '["apple", "banana"]', newCode: 'fruits = ["apple", "banana"]', correct: false },
            { label: '("apple", "banana", "cherry", "date")', newCode: 'fruits = ("apple", "banana", "cherry", "date")', correct: false },
          ],
        },
        {
          line: 6,
          description: 'Get the second item instead of the first',
          currentCode: 'first = fruits[0]',
          options: [
            { label: 'fruits[1]', newCode: 'first = fruits[1]', correct: true },
            { label: 'fruits[2]', newCode: 'first = fruits[2]', correct: false },
            { label: 'fruits[-1]', newCode: 'first = fruits[-1]', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 3: Dictionaries
  {
    id: 'dictionaries',
    name: 'Dictionaries',
    chapter: 0,
    description: 'Store data as key-value pairs for fast lookups.',
    tracer: [
      { text: 'A dict maps keys to values.', viz: 'dict_create' },
      { text: 'Access values by their key.', viz: 'dict_access' },
      { text: 'Add or update entries easily.', viz: 'dict_update' },
    ],
    code: [
      'student = {',
      '    "name": "Alice",',
      '    "grade": 90,',
      '    "active": True',
      '}',
      '',
      'print(student["name"])',
      'print(student.get("grade"))',
      '',
      'student["grade"] = 95',
      'student["email"] = "alice@school.edu"',
      'print(student)',
    ],

    xray: {
      pipeline: ['create\ndict', 'access\nvalues', 'update\ndict'],
      regions: [
        {
          startLine: 0,
          endLine: 4,
          color: 'XRAY_DATA',
          correctLabel: 'Create a dictionary',
          explanation: 'Curly braces with key: value pairs make a dictionary.',
          deepDive: 'A dictionary is like a mini database -- each key is a label that points to a value. Here "name" maps to "Alice", "grade" maps to 90, and "active" maps to True.',
          deeperDive: 'Dictionaries (dicts) use a hash table internally, giving O(1) average-case lookups, insertions, and deletions. Keys must be hashable (immutable types like strings, numbers, tuples), but values can be anything. Since Python 3.7, dicts preserve insertion order. You can create an empty dict with {} or dict(). Other ways to create dicts include dict(name="Alice", grade=90) and dict([("name", "Alice"), ("grade", 90)]). Dicts are one of the most-used data structures in Python -- they back module namespaces, class instances, and function keyword arguments.',
          options: ['Create a dictionary', 'Access a value', 'Update the dictionary', 'Loop through keys'],
        },
        {
          startLine: 6,
          endLine: 7,
          color: 'XRAY_MODEL',
          correctLabel: 'Access values by key',
          explanation: 'Use ["key"] or .get("key") to retrieve a value.',
          deepDive: 'student["name"] returns "Alice". Using .get("grade") does the same but will not crash if the key is missing -- it returns None instead of raising an error.',
          deeperDive: 'The bracket syntax student["name"] raises a KeyError if the key does not exist, which crashes your program. The .get() method is safer: student.get("phone") returns None, and student.get("phone", "N/A") returns "N/A" as a default. You can check if a key exists with "name" in student (returns True/False). For iterating, student.keys() gives all keys, student.values() gives all values, and student.items() gives (key, value) tuples. All three return view objects that update automatically if the dict changes.',
          options: ['Access values by key', 'Create a dictionary', 'Update the dictionary', 'Delete a key'],
        },
        {
          startLine: 9,
          endLine: 11,
          color: 'XRAY_TRAIN',
          correctLabel: 'Update and add entries',
          explanation: 'Assigning to an existing key updates it. A new key adds a new entry.',
          deepDive: 'student["grade"] = 95 changes the existing value from 90 to 95. student["email"] = "alice@school.edu" creates a brand-new key-value pair because "email" did not exist before.',
          deeperDive: 'Dicts are mutable, so updates happen in place. You can also use .update() to merge another dict: student.update({"grade": 95, "email": "alice@school.edu"}) does the same in one call. To remove a key, use del student["active"] (raises KeyError if missing) or student.pop("active", None) (returns None if missing). The .setdefault() method adds a key only if it is missing: student.setdefault("grade", 0) would not change "grade" because it already exists, but student.setdefault("phone", "N/A") would add it.',
          options: ['Update and add entries', 'Access values by key', 'Create a dictionary', 'Print the dictionary'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'create',
          code: 'student = {\n    "name": "Alice",\n    "grade": 90,\n    "active": True\n}',
          lines: [0, 1, 2, 3, 4],
        },
        {
          id: 'access',
          code: 'print(student["name"])\nprint(student.get("grade"))',
          lines: [6, 7],
        },
        {
          id: 'update',
          code: 'student["grade"] = 95\nstudent["email"] = "alice@school.edu"\nprint(student)',
          lines: [9, 10, 11],
        },
      ],
    },

    rewire: {
      goal: 'Change grade to 100 and add a phone number',
      targets: [
        {
          line: 9,
          description: 'Change the new grade value',
          currentCode: 'student["grade"] = 95',
          options: [
            { label: '= 100', newCode: 'student["grade"] = 100', correct: true },
            { label: '= "100"', newCode: 'student["grade"] = "100"', correct: false },
            { label: '= 90', newCode: 'student["grade"] = 90', correct: false },
          ],
        },
        {
          line: 10,
          description: 'Add a phone number instead of email',
          currentCode: 'student["email"] = "alice@school.edu"',
          options: [
            { label: 'student["phone"] = "555-0123"', newCode: 'student["phone"] = "555-0123"', correct: true },
            { label: 'student["email"] = "555-0123"', newCode: 'student["email"] = "555-0123"', correct: false },
            { label: 'student.phone = "555-0123"', newCode: 'student.phone = "555-0123"', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 2: Control Flow
  // ================================================================

  // LESSON 4: If / Else
  {
    id: 'if_else',
    name: 'If / Else',
    chapter: 1,
    description: 'Make decisions based on conditions.',
    tracer: [
      { text: 'A condition is either True or False.', viz: 'if_check' },
      { text: 'Code runs only when the condition matches.', viz: 'if_branch' },
      { text: 'elif and else catch other cases.', viz: 'if_result' },
    ],
    code: [
      'score = 85',
      '',
      'if score >= 90:',
      '    grade = "A"',
      'elif score >= 80:',
      '    grade = "B"',
      'elif score >= 70:',
      '    grade = "C"',
      'else:',
      '    grade = "F"',
      '',
      'print(f"Score {score} = {grade}")',
    ],

    xray: {
      pipeline: ['set\nscore', 'if /\nelif', 'else', 'print'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_DATA',
          correctLabel: 'Set the input value',
          explanation: 'score = 85 is the value we will test with conditions below.',
          deepDive: 'This is the data that flows into the decision tree. With score set to 85, we will check which grade bracket it falls into.',
          deeperDive: 'In a real program this value might come from user input (score = int(input("Enter score: "))) or from a calculation. The variable holds a plain integer. Python integers have unlimited precision -- even score = 99999999999999999 works without overflow, unlike many other languages that cap at 32 or 64 bits.',
          options: ['Set the input value', 'Check a condition', 'Assign a grade', 'Print the result'],
        },
        {
          startLine: 2,
          endLine: 5,
          color: 'XRAY_MODEL',
          correctLabel: 'Check conditions (if/elif)',
          explanation: 'Python checks each condition top to bottom. The first True branch runs.',
          deepDive: 'if score >= 90 is False (85 is not >= 90), so Python skips that block. Then elif score >= 80 is True (85 >= 80), so grade = "B" runs. Python stops checking after the first match.',
          deeperDive: 'Python evaluates conditions with short-circuit logic and stops at the first True branch. The comparison operators are: == (equal), != (not equal), <, >, <=, >=. You can chain them: 70 <= score < 90 is valid Python and checks both conditions at once. Boolean operators (and, or, not) combine conditions: if score >= 80 and score < 90. Indentation (4 spaces by convention) defines which code belongs to each branch -- this is unique to Python and enforces readable code structure.',
          options: ['Check conditions (if/elif)', 'Set the input value', 'Handle the default case', 'Print the result'],
        },
        {
          startLine: 6,
          endLine: 9,
          color: 'XRAY_TRAIN',
          correctLabel: 'Handle remaining cases',
          explanation: 'elif adds more conditions. else catches everything that did not match.',
          deepDive: 'elif is short for "else if." You can have as many elif branches as you want. The else at the end is the safety net -- if no condition above was True, this code runs.',
          deeperDive: 'The else block is optional. If you omit it and no condition matches, nothing happens and grade would be undefined, causing a NameError later when you try to use it. A common pattern is to set a default value before the if chain: grade = "F" at the top, then only use if/elif without else. Python does not have a switch/case statement (until Python 3.10\'s match/case), so if/elif chains are the standard approach for multi-way branching.',
          options: ['Handle remaining cases', 'Check conditions (if/elif)', 'Set the input value', 'Print the result'],
        },
        {
          startLine: 11,
          endLine: 11,
          color: 'XRAY_PREDICT',
          correctLabel: 'Print the result',
          explanation: 'The f-string shows both the score and the letter grade.',
          deepDive: 'Since score is 85 and the elif matched "B", this prints "Score 85 = B". The f-string plugs both variables into the output string.',
          deeperDive: 'f-strings can contain any valid Python expression: f"{score / 100:.0%}" would print "85%". For debugging, Python 3.8 added self-documenting f-strings: f"{score=}" prints "score=85", showing both the variable name and value. This is handy when debugging multiple variables at once.',
          options: ['Print the result', 'Check conditions', 'Set the input value', 'Handle the default case'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'score',
          code: 'score = 85',
          lines: [0],
        },
        {
          id: 'if_elif',
          code: 'if score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"',
          lines: [2, 3, 4, 5],
        },
        {
          id: 'else',
          code: 'elif score >= 70:\n    grade = "C"\nelse:\n    grade = "F"',
          lines: [6, 7, 8, 9],
        },
        {
          id: 'print',
          code: 'print(f"Score {score} = {grade}")',
          lines: [11],
        },
      ],
    },

    rewire: {
      goal: 'Change score to 72 and add a D grade for 60-69',
      targets: [
        {
          line: 0,
          description: 'Change the score value',
          currentCode: 'score = 85',
          options: [
            { label: '72', newCode: 'score = 72', correct: true },
            { label: '"72"', newCode: 'score = "72"', correct: false },
            { label: '85', newCode: 'score = 85', correct: false },
          ],
        },
        {
          line: 8,
          description: 'Add a D grade before the else',
          currentCode: 'else:',
          options: [
            { label: 'elif score >= 60:', newCode: 'elif score >= 60:', correct: true },
            { label: 'elif score >= 50:', newCode: 'elif score >= 50:', correct: false },
            { label: 'if score >= 60:', newCode: 'if score >= 60:', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 5: For Loops
  {
    id: 'for_loops',
    name: 'For Loops',
    chapter: 1,
    description: 'Repeat actions over items or a range of numbers.',
    tracer: [
      { text: 'A for loop visits each item in a sequence.', viz: 'loop_start' },
      { text: 'The body runs once for each item.', viz: 'loop_step' },
      { text: 'range() generates a sequence of numbers.', viz: 'loop_total' },
    ],
    code: [
      'colors = ["red", "green", "blue"]',
      'for color in colors:',
      '    print(color)',
      '',
      'total = 0',
      'for i in range(1, 6):',
      '    total += i',
      'print(f"Sum: {total}")',
    ],

    xray: {
      pipeline: ['list', 'for\nloop', 'range\nloop', 'result'],
      regions: [
        {
          startLine: 0,
          endLine: 2,
          color: 'XRAY_DATA',
          correctLabel: 'Loop through a list',
          explanation: 'for color in colors visits each item and prints it.',
          deepDive: 'The loop variable color takes on each value in the list: first "red", then "green", then "blue". The indented body (print) runs each time.',
          deeperDive: 'Python\'s for loop is actually a for-each loop -- it iterates over any iterable object (lists, strings, tuples, dicts, files, generators). Under the hood, Python calls iter() on the object to get an iterator, then repeatedly calls next() on it until StopIteration is raised. The loop variable (color) is not limited to the loop body -- it persists after the loop ends, holding the last value ("blue"). This is different from languages like Java or C++ where loop variables are scoped to the loop.',
          options: ['Loop through a list', 'Sum numbers with range', 'Print the total', 'Create a list'],
        },
        {
          startLine: 4,
          endLine: 7,
          color: 'XRAY_TRAIN',
          correctLabel: 'Sum numbers with range',
          explanation: 'range(1, 6) gives 1, 2, 3, 4, 5. total accumulates the sum.',
          deepDive: 'range(1, 6) produces the numbers 1 through 5 (the stop value 6 is not included). The += operator adds each number to total, so total becomes 1 + 2 + 3 + 4 + 5 = 15.',
          deeperDive: 'range(start, stop, step) generates integers from start up to (not including) stop, incrementing by step. range(1, 6) is shorthand for range(1, 6, 1). range(0, 10, 2) gives 0, 2, 4, 6, 8. range(5, 0, -1) counts down: 5, 4, 3, 2, 1. range() is lazy -- it does not create a list in memory. For large ranges like range(1_000_000), this saves huge amounts of memory compared to creating an actual list. The += operator is shorthand for total = total + i.',
          options: ['Sum numbers with range', 'Loop through a list', 'Print the total', 'Define a variable'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'list_loop',
          code: 'colors = ["red", "green", "blue"]\nfor color in colors:\n    print(color)',
          lines: [0, 1, 2],
        },
        {
          id: 'range_setup',
          code: 'total = 0\nfor i in range(1, 6):\n    total += i',
          lines: [4, 5, 6],
        },
        {
          id: 'result',
          code: 'print(f"Sum: {total}")',
          lines: [7],
        },
      ],
    },

    rewire: {
      goal: 'Sum numbers from 1 to 10 instead of 1 to 5',
      targets: [
        {
          line: 5,
          description: 'Change the range endpoint',
          currentCode: 'for i in range(1, 6):',
          options: [
            { label: 'range(1, 11)', newCode: 'for i in range(1, 11):', correct: true },
            { label: 'range(1, 10)', newCode: 'for i in range(1, 10):', correct: false },
            { label: 'range(0, 10)', newCode: 'for i in range(0, 10):', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 6: Functions
  {
    id: 'functions',
    name: 'Functions',
    chapter: 1,
    description: 'Define reusable blocks of code with parameters and return values.',
    tracer: [
      { text: 'def defines a reusable block of code.', viz: 'func_define' },
      { text: 'Call a function by name with arguments.', viz: 'func_call' },
      { text: 'return sends a value back to the caller.', viz: 'func_return' },
    ],
    code: [
      'def greet(name):',
      '    return f"Hello, {name}!"',
      '',
      'def add(a, b):',
      '    result = a + b',
      '    return result',
      '',
      'message = greet("Alice")',
      'print(message)',
      '',
      'total = add(3, 7)',
      'print(f"3 + 7 = {total}")',
    ],

    xray: {
      pipeline: ['def\ngreet', 'def\nadd', 'call\ngreet', 'call\nadd'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Define greet function',
          explanation: 'def greet(name) creates a function that takes one parameter and returns a greeting.',
          deepDive: 'The def keyword starts a function definition. name is a parameter -- a placeholder that gets filled in when you call the function. return sends the result back to whoever called it.',
          deeperDive: 'When Python sees a def statement, it creates a function object and assigns it to the given name. The function body does not run until you call it. Parameters can have default values: def greet(name="World") lets you call greet() without arguments. You can also use type hints for documentation: def greet(name: str) -> str: -- these do not enforce types but help readability and IDE support. Functions are first-class objects in Python, meaning you can assign them to variables, pass them as arguments, and store them in lists.',
          options: ['Define greet function', 'Define add function', 'Call greet', 'Call add'],
        },
        {
          startLine: 3,
          endLine: 5,
          color: 'XRAY_DATA',
          correctLabel: 'Define add function',
          explanation: 'add takes two parameters, computes their sum, and returns it.',
          deepDive: 'This function takes two numbers, adds them together, stores the result in a local variable, and returns it. The variable result only exists inside the function.',
          deeperDive: 'Variables created inside a function (like result) are local -- they exist only while the function runs and cannot be accessed from outside. This is called scope. If you try to use result outside of add(), Python raises a NameError. Functions can take any number of parameters, and you can use *args for variable positional arguments and **kwargs for variable keyword arguments. A function without a return statement implicitly returns None.',
          options: ['Define add function', 'Define greet function', 'Call greet', 'Print the result'],
        },
        {
          startLine: 7,
          endLine: 8,
          color: 'XRAY_MODEL',
          correctLabel: 'Call greet function',
          explanation: 'greet("Alice") runs the function with "Alice" as the argument.',
          deepDive: 'When you call greet("Alice"), Python jumps into the function, sets name to "Alice", builds the f-string "Hello, Alice!", and returns it. The result is stored in message.',
          deeperDive: 'The argument "Alice" gets assigned to the parameter name inside the function. Python uses "call by assignment" -- the parameter name is bound to the same object as the argument. For immutable objects like strings, this means the original cannot be modified. For mutable objects like lists, changes inside the function affect the original. The return value replaces the function call expression, so message = greet("Alice") is equivalent to message = "Hello, Alice!" after the function runs.',
          options: ['Call greet function', 'Define greet function', 'Call add function', 'Print output'],
        },
        {
          startLine: 10,
          endLine: 11,
          color: 'XRAY_PREDICT',
          correctLabel: 'Call add function',
          explanation: 'add(3, 7) returns 10, which gets printed.',
          deepDive: 'add(3, 7) passes 3 and 7 into the function. Inside, a becomes 3 and b becomes 7. The result 10 gets returned and stored in total.',
          deeperDive: 'You can call functions with positional arguments (add(3, 7)) or keyword arguments (add(a=3, b=7) or add(b=7, a=3)). Keyword arguments can appear in any order, making code more readable for functions with many parameters. Built-in functions like print() and len() work the same way -- they are just pre-defined functions. You can even define functions inside other functions (closures) or define them inline with lambda: add = lambda a, b: a + b.',
          options: ['Call add function', 'Call greet function', 'Define add function', 'Print output'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'def_greet',
          code: 'def greet(name):\n    return f"Hello, {name}!"',
          lines: [0, 1],
        },
        {
          id: 'def_add',
          code: 'def add(a, b):\n    result = a + b\n    return result',
          lines: [3, 4, 5],
        },
        {
          id: 'call_greet',
          code: 'message = greet("Alice")\nprint(message)',
          lines: [7, 8],
        },
        {
          id: 'call_add',
          code: 'total = add(3, 7)\nprint(f"3 + 7 = {total}")',
          lines: [10, 11],
        },
      ],
    },

    rewire: {
      goal: 'Make greet take a greeting word and change add to multiply',
      targets: [
        {
          line: 0,
          description: 'Add a second parameter for the greeting word',
          currentCode: 'def greet(name):',
          options: [
            { label: 'def greet(name, word):', newCode: 'def greet(name, word):', correct: true },
            { label: 'def greet(word):', newCode: 'def greet(word):', correct: false },
            { label: 'def greet(name, word="Hi"):', newCode: 'def greet(name, word="Hi"):', correct: false },
          ],
        },
        {
          line: 4,
          description: 'Change addition to multiplication',
          currentCode: '    result = a + b',
          options: [
            { label: 'a * b', newCode: '    result = a * b', correct: true },
            { label: 'a - b', newCode: '    result = a - b', correct: false },
            { label: 'a / b', newCode: '    result = a / b', correct: false },
          ],
        },
      ],
    },
  },

  // ================================================================
  // CHAPTER 3: Beyond Basics
  // ================================================================

  // LESSON 7: List Comprehensions
  {
    id: 'list_comprehensions',
    name: 'List Comprehensions',
    chapter: 2,
    description: 'Build lists in one line with filters and transforms.',
    tracer: [
      { text: 'A comprehension builds a list in one expression.', viz: 'comp_basic' },
      { text: 'Add an if clause to filter items.', viz: 'comp_filter' },
      { text: 'The result is a brand-new list.', viz: 'comp_result' },
    ],
    code: [
      'numbers = [1, 2, 3, 4, 5, 6, 7, 8]',
      '',
      'squares = [x ** 2 for x in numbers]',
      'print(squares)',
      '',
      'evens = [x for x in numbers if x % 2 == 0]',
      'print(evens)',
      '',
      'big_evens = [x ** 2 for x in numbers if x % 2 == 0]',
      'print(big_evens)',
    ],

    xray: {
      pipeline: ['source\nlist', 'basic\ncomp', 'filter\ncomp', 'combined'],
      regions: [
        {
          startLine: 0,
          endLine: 0,
          color: 'XRAY_DATA',
          correctLabel: 'Create the source list',
          explanation: 'This list of numbers is the raw data we will transform.',
          deepDive: 'numbers holds the integers 1 through 8. This will be our input for all three list comprehensions below.',
          deeperDive: 'You could also create this with list(range(1, 9)), which generates the same sequence. For very large lists, using a generator expression (parentheses instead of brackets) or range() directly is more memory-efficient because they produce values lazily rather than storing everything at once. But for small lists like this, the literal syntax is clearer and perfectly fine.',
          options: ['Create the source list', 'Build a basic comprehension', 'Filter items', 'Transform and filter'],
        },
        {
          startLine: 2,
          endLine: 3,
          color: 'XRAY_MODEL',
          correctLabel: 'Basic comprehension (transform)',
          explanation: '[x ** 2 for x in numbers] squares every number in the list.',
          deepDive: 'Read it as: "give me x squared, for each x in numbers." It visits 1, 2, 3, ..., 8 and produces [1, 4, 9, 16, 25, 36, 49, 64].',
          deeperDive: 'List comprehensions are syntactic sugar for a loop-and-append pattern. The equivalent long form is: squares = []; for x in numbers: squares.append(x ** 2). Comprehensions are faster because Python optimizes the internal loop. The expression before "for" can be any valid expression: [x.upper() for x in words], [len(s) for s in strings], [f"{x}!" for x in names]. You can even nest comprehensions: [[i*j for j in range(3)] for i in range(3)] creates a 3x3 matrix.',
          options: ['Basic comprehension (transform)', 'Create the source list', 'Filter items', 'Transform and filter'],
        },
        {
          startLine: 5,
          endLine: 6,
          color: 'XRAY_TRAIN',
          correctLabel: 'Filter comprehension',
          explanation: 'Adding if x % 2 == 0 keeps only even numbers.',
          deepDive: 'The if clause acts like a gatekeeper. For each x, Python checks if x is even (divisible by 2). Only the numbers that pass the test make it into the new list: [2, 4, 6, 8].',
          deeperDive: 'The modulo operator % gives the remainder after division. x % 2 == 0 means "x divided by 2 has remainder 0," which is the definition of even. You can chain multiple conditions: [x for x in numbers if x % 2 == 0 if x > 3] keeps only even numbers greater than 3. This is equivalent to [x for x in numbers if x % 2 == 0 and x > 3]. The filter happens after the for clause, so every item is visited but only matching ones are included in the result.',
          options: ['Filter comprehension', 'Basic comprehension', 'Create the source list', 'Transform and filter'],
        },
        {
          startLine: 8,
          endLine: 9,
          color: 'XRAY_PREDICT',
          correctLabel: 'Transform and filter combined',
          explanation: 'Squares only the even numbers: [4, 16, 36, 64].',
          deepDive: 'This combines both ideas: first filter (keep evens), then transform (square them). Only 2, 4, 6, 8 pass the filter, and they become 4, 16, 36, 64.',
          deeperDive: 'The order of execution is: for x in numbers (iterate), if x % 2 == 0 (filter), x ** 2 (transform). Despite the expression x ** 2 appearing first in the syntax, the filter runs before it. This is more efficient than squaring all numbers and then filtering, because you avoid computing squares you will throw away. The equivalent with map() and filter() would be: list(map(lambda x: x**2, filter(lambda x: x % 2 == 0, numbers))), which is less readable.',
          options: ['Transform and filter combined', 'Filter comprehension', 'Basic comprehension', 'Create the source list'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'source',
          code: 'numbers = [1, 2, 3, 4, 5, 6, 7, 8]',
          lines: [0],
        },
        {
          id: 'squares',
          code: 'squares = [x ** 2 for x in numbers]\nprint(squares)',
          lines: [2, 3],
        },
        {
          id: 'evens',
          code: 'evens = [x for x in numbers if x % 2 == 0]\nprint(evens)',
          lines: [5, 6],
        },
        {
          id: 'big_evens',
          code: 'big_evens = [x ** 2 for x in numbers if x % 2 == 0]\nprint(big_evens)',
          lines: [8, 9],
        },
      ],
    },

    rewire: {
      goal: 'Cube odd numbers instead of squaring evens',
      targets: [
        {
          line: 8,
          description: 'Change to cube odd numbers',
          currentCode: 'big_evens = [x ** 2 for x in numbers if x % 2 == 0]',
          options: [
            { label: '[x ** 3 for x in numbers if x % 2 != 0]', newCode: 'big_evens = [x ** 3 for x in numbers if x % 2 != 0]', correct: true },
            { label: '[x ** 3 for x in numbers if x % 2 == 0]', newCode: 'big_evens = [x ** 3 for x in numbers if x % 2 == 0]', correct: false },
            { label: '[x ** 2 for x in numbers if x % 2 != 0]', newCode: 'big_evens = [x ** 2 for x in numbers if x % 2 != 0]', correct: false },
          ],
        },
      ],
    },
  },

  // LESSON 8: Reading a File
  {
    id: 'reading_a_file',
    name: 'Reading a File',
    chapter: 2,
    description: 'Open a text file and process its contents.',
    tracer: [
      { text: 'open() connects your program to a file.', viz: 'file_open' },
      { text: 'Read lines into a list with readlines().', viz: 'file_read' },
      { text: 'Parse each line to extract data.', viz: 'file_parse' },
    ],
    code: [
      'with open("scores.txt") as f:',
      '    lines = f.readlines()',
      '',
      'scores = []',
      'for line in lines:',
      '    value = int(line.strip())',
      '    scores.append(value)',
      '',
      'average = sum(scores) / len(scores)',
      'print(f"Average: {average:.1f}")',
    ],

    xray: {
      pipeline: ['open\nfile', 'read\nlines', 'parse\ndata', 'compute\nresult'],
      regions: [
        {
          startLine: 0,
          endLine: 1,
          color: 'XRAY_IMPORT',
          correctLabel: 'Open and read the file',
          explanation: 'with open() safely opens the file. readlines() gets all lines as a list.',
          deepDive: 'The with statement opens the file and guarantees it gets closed when the block ends, even if an error happens. readlines() slurps all lines into a list of strings.',
          deeperDive: 'The with statement is a context manager -- it calls f.close() automatically when the block exits, preventing resource leaks. Without with, you would need try/finally: f = open("scores.txt"); try: lines = f.readlines(); finally: f.close(). The default mode is "r" (read text). Other modes include "w" (write, truncates), "a" (append), "rb" (read binary), and "r+" (read and write). readlines() reads the entire file into memory as a list of strings, each ending with a newline character "\\n".',
          options: ['Open and read the file', 'Parse each line', 'Compute the average', 'Print the result'],
        },
        {
          startLine: 3,
          endLine: 6,
          color: 'XRAY_DATA',
          correctLabel: 'Parse lines into numbers',
          explanation: 'strip() removes whitespace, int() converts text to a number.',
          deepDive: 'Each line from the file is a string like "85\\n". strip() removes the newline, and int() converts "85" to the number 85. Each cleaned number gets added to the scores list.',
          deeperDive: 'strip() removes leading and trailing whitespace (spaces, tabs, newlines). There is also lstrip() and rstrip() for one side only. int() converts a string to an integer -- it raises ValueError if the string is not a valid number (e.g., int("hello") crashes). For decimal numbers, use float() instead. A more Pythonic way to do this entire loop is with a list comprehension: scores = [int(line.strip()) for line in lines]. You could even skip readlines() entirely: scores = [int(line.strip()) for line in open("scores.txt")].',
          options: ['Parse lines into numbers', 'Open and read the file', 'Compute the average', 'Print the result'],
        },
        {
          startLine: 8,
          endLine: 9,
          color: 'XRAY_PREDICT',
          correctLabel: 'Compute and print average',
          explanation: 'sum() adds all scores, len() counts them, division gives the average.',
          deepDive: 'sum(scores) adds up all the numbers. len(scores) counts how many there are. Dividing gives the average. The :.1f format shows one decimal place.',
          deeperDive: 'Division with / always returns a float in Python 3, even for integers: 10 / 3 gives 3.3333... (not 3 like in Python 2 or C). For integer division, use //: 10 // 3 gives 3. The format specifier :.1f rounds to one decimal: if the average is 82.666..., it displays as "82.7". sum() works on any iterable of numbers. len() works on sequences and collections. For an empty list, this would crash with ZeroDivisionError, so in production code you would check if len(scores) > 0 first.',
          options: ['Compute and print average', 'Parse lines into numbers', 'Open and read the file', 'Loop through lines'],
        },
      ],
    },

    assemble: {
      blocks: [
        {
          id: 'open',
          code: 'with open("scores.txt") as f:\n    lines = f.readlines()',
          lines: [0, 1],
        },
        {
          id: 'parse',
          code: 'scores = []\nfor line in lines:\n    value = int(line.strip())\n    scores.append(value)',
          lines: [3, 4, 5, 6],
        },
        {
          id: 'compute',
          code: 'average = sum(scores) / len(scores)\nprint(f"Average: {average:.1f}")',
          lines: [8, 9],
        },
      ],
    },

    rewire: {
      goal: 'Read from "grades.csv" and convert to float instead of int',
      targets: [
        {
          line: 0,
          description: 'Change the filename',
          currentCode: 'with open("scores.txt") as f:',
          options: [
            { label: '"grades.csv"', newCode: 'with open("grades.csv") as f:', correct: true },
            { label: '"scores.csv"', newCode: 'with open("scores.csv") as f:', correct: false },
            { label: '"grades.txt"', newCode: 'with open("grades.txt") as f:', correct: false },
          ],
        },
        {
          line: 5,
          description: 'Use float() instead of int()',
          currentCode: '    value = int(line.strip())',
          options: [
            { label: 'float(line.strip())', newCode: '    value = float(line.strip())', correct: true },
            { label: 'str(line.strip())', newCode: '    value = str(line.strip())', correct: false },
            { label: 'int(line)', newCode: '    value = int(line)', correct: false },
          ],
        },
      ],
    },
  },
];
