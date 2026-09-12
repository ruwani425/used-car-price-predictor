# 🎓 VIVA VOCE DEFENSE & TECHNICAL EXAMINATION GUIDE
## Sri Lankan Used Car Price Valuation & Market Intelligence Platform

This guide is designed to prepare both project members for the academic viva voce defense. It contains expected examiner questions, core machine learning theory, architecture justifications, and high-impact answers.

---

## 📌 Section 1: Team Responsibilities & Work Distribution

| Area | Member 1 Focus | Member 2 Focus |
| :--- | :--- | :--- |
| **Machine Learning** | Data cleaning, handling duplicates & missing values, implementing the 7 feature engineering techniques. | Benchmarking 5 regression models, hyperparameter tuning, cross-validation, model serialization (`.pkl`, `metrics.json`). |
| **Backend & APIs** | FastAPI ML microservice endpoints (`/api/ml/predict`, `/api/ml/metadata`), multi-currency conversion engine, prediction history. | Express.js API Gateway, request validation middleware, Axios proxy client, CORS & error handling. |
| **Frontend & UI** | Valuation result card with confidence intervals, 5-year depreciation chart, multi-currency display. | Material UI dark luxury design system, cascading Brand $\rightarrow$ Model dynamic form, analytics leaderboard, vehicle comparison. |

---

## 🧠 Section 2: Machine Learning Deep-Dive Questions & Answers

### Q1: Why did you apply a Log Transformation $\log(1 + y)$ on the Target Price variable?
> **Examiner Intent**: Testing knowledge of target distribution skewness, homoscedasticity, and regression assumptions.

**Answer**:
"The raw vehicle price in Sri Lankan Lakhs exhibits severe positive (right) skewness because luxury vehicles and outliers stretch the upper tail up to 300+ Lakhs, while the majority of vehicles cluster between 20 and 80 Lakhs. 
1. Standard linear regression and gradient-based loss functions are penalized heavily by large absolute errors in the upper tail, leading to biased predictions for affordable cars.
2. Applying $y_{\text{train}} = \log(1 + y)$ normalizes the residuals, satisfies linear homoscedasticity (constant variance of residuals), and compresses the exponential scale into an approximately normal distribution.
3. At inference time, we invert the prediction using $\hat{y} = \exp(\hat{y}_{\text{log}}) - 1$ to return the ground-truth value in LKR Lakhs."

---

### Q2: Why did you choose IQR (Interquartile Range) clipping over Z-score filtering for outlier treatment?
> **Examiner Intent**: Understanding robust vs non-robust statistical measures.

**Answer**:
"Z-score outlier detection relies on the mean ($\mu$) and standard deviation ($\sigma$). Both mean and standard deviation are themselves highly sensitive to extreme outliers, which skews the Z-score calculation. 
In contrast, the Interquartile Range ($\text{IQR} = Q_3 - Q_1$) relies on percentiles (median-based), making it a **robust statistic**. By clamping values to $[Q_1 - 1.5 \times \text{IQR}, Q_3 + 1.5 \times \text{IQR}]$, we neutralize data-entry errors (e.g. 999,999 km mileage) without distorting the underlying distribution."

---

### Q3: Explain why High-Cardinality Rare Category Grouping was necessary for the `model` feature.
> **Examiner Intent**: Understanding the curse of dimensionality and categorical sparsity.

**Answer**:
"The dataset contained over 450 unique car model names, many of which only appeared once or twice. If we performed one-hot encoding directly, it would create 450+ sparse binary columns where most columns have only 1 positive entry. This causes severe overfitting and high variance.
We enforced a threshold rule: any model with fewer than 25 occurrences was grouped into the category `'OTHER'`. This condensed the model space into 68 statistically meaningful clusters while drastically reducing model complexity."

---

### Q4: What is the theoretical difference between Random Forest and Gradient Boosting, and why did Gradient Boosting win?
> **Examiner Intent**: Testing comprehension of Bagging vs. Boosting ensemble techniques.

**Answer**:
"1. **Random Forest uses Bagging (Bootstrap Aggregating)**: It builds multiple deep, independent decision trees in parallel on bootstrap samples and averages their outputs. It focuses primarily on **reducing variance** of unstable, high-variance trees.
2. **Gradient Boosting uses Boosting**: It builds shallow trees sequentially. Each subsequent tree is trained to predict the **pseudo-residuals (negative gradients)** of the combined previous ensemble, minimizing the differentiable loss function step by step. It focuses on **reducing bias**.
3. In our dataset (with complex non-linear feature interactions between age, mileage, engine capacity, and transmission), Gradient Boosting achieved the highest 5-fold CV $R^2$ of **0.9063** and lowest RMSE of **26.69 Lakhs** by systematically refining errors that independent bagged trees averaged out."

---

### Q5: How do you prevent Data Leakage during feature engineering and scaling?
> **Examiner Intent**: Testing best practices in ML experimental design.

**Answer**:
"Data leakage happens when information from the test/validation set inadvertently leaks into training computations. We prevented this by:
1. Performing the 80/20 train-test split **before** fitting the feature metadata (such as brand frequencies, town frequencies, IQR bounds, and categorical mappings).
2. All encodings and statistical bounds were learned exclusively from the training set ($N = 7,816$) and stored in `metadata.json`.
3. The test set ($N = 1,954$) was transformed purely using the pre-fitted parameters without re-calculating statistics."

---

### Q6: How does the model handle an unseen car model or town at inference time?
> **Examiner Intent**: Handling edge cases and out-of-vocabulary categories in production.

**Answer**:
"In `app.py`, we implemented robust fallback handling:
- If a user enters a town not present in our training vocabulary, its frequency defaults to the minimum observed frequency (`min_freq = 0.0001`).
- If an unseen vehicle model is provided, the pipeline automatically routes the feature encoding to the `model_grouped_OTHER` one-hot column. This guarantees the model never crashes on out-of-vocabulary inputs."

---

## 🏛️ Section 3: Architecture & Web Engineering Questions

### Q7: Why adopt a 3-tier microservices architecture (FastAPI + Express + React) instead of a monolithic Flask or Django app?
> **Examiner Intent**: Software architecture rationale and separation of concerns.

**Answer**:
"1. **Separation of Concerns**: Machine learning pipelines belong in Python due to Scikit-Learn and NumPy performance. However, web concerns (rate limiting, multi-currency conversion, user history caching, client payload sanitization) are best suited for asynchronous I/O in Node.js Express.
2. **Scalability**: The compute-intensive ML microservice can be scaled horizontally behind a load balancer independently of the lightweight API Gateway.
3. **Security & Validation**: The Express Gateway acts as an enterprise firewall, verifying payloads with custom middleware before touching the ML inference engine."

---

### Q8: How does the dynamic cascading dropdown (Brand $\rightarrow$ Model) work in React?
> **Examiner Intent**: React state management and component design.

**Answer**:
"1. On initial mount, the React frontend fetches the complete metadata schema (`GET /api/metadata`) containing a mapped dictionary of brands and their respective valid models.
2. When the user selects a `Brand`, the `handleBrandChange` event updates the `selectedBrand` state and dynamically filters the `modelOptions` array.
3. If the previously selected model does not exist under the new brand, the model state is reset to empty, preventing invalid combinations (e.g., Brand: 'TOYOTA' with Model: 'CIVIC')."

---

### Q9: How is the 5-Year Depreciation Forecast calculated?
> **Examiner Intent**: Financial forecasting domain logic.

**Answer**:
"The depreciation curve utilizes a non-linear exponential decay formula tailored to the vehicle's current age:
- Newer vehicles ($\le 3$ years old) depreciate at an initial rate of $\sim 8.0\%$ annually.
- As the vehicle ages ($> 5$ years), the annual depreciation rate plateaus towards $\sim 4.5\% - 5.5\%$ annually as it reaches its residual baseline.
- The formula: $\text{Price}_{t} = \text{Price}_0 \times (1 - r)^t$ generates the estimated valuation curve for $t \in [0, 5]$ years, which is visualized interactively via SVG."

---

## 🎯 Section 4: Quick-Fire Summary Cards for Examiners

```
┌─────────────────────────────────────────────────────────────┐
│                   KEY PROJECT METRICS                       │
├─────────────────────────────────────────────────────────────┤
│ • Dataset Records     : 9,770 (Cleaned from 9,788)          │
│ • Best Model          : Gradient Boosting Regressor         │
│ • 5-Fold Cross-Val R² : 0.9063 ± 0.005                      │
│ • Test Set R²         : 0.7001                              │
│ • Test RMSE           : 26.69 Lakhs (LKR)                   │
│ • Test MAPE           : 14.75%                              │
│ • Feature Space       : 273 Engineered Features             │
│ • Top Feature         : Transmission Type (48.8% importance)│
│ • Target Transform    : log(1 + y) Target Transformation    │
│ • Supported Currencies: LKR, USD, EUR, GBP, JPY             │
└─────────────────────────────────────────────────────────────┘
```
