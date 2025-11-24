# 🚨 Sentry Alert Configuration - Step-by-Step Guide

## **Overview**

This guide provides detailed instructions to configure Sentry alerts for Verso Austral's production monitoring.

---

## **Prerequisites**

- ✅ Sentry account with Verso Austral project created
- ✅ Frontend and backend DSN secrets configured
- ✅ Smoke tests passed (errors appearing in Sentry dashboard)

---

## **Alert Strategy**

### **Tier 1: CRITICAL (Immediate Action Required)**
- 🔴 Error rate spike (system-wide failure)
- 🔴 Database errors (data corruption risk)
- 🔴 Auth system failures (user lockout)
- **Response Time:** < 5 minutes
- **Notification:** Email + Slack (if configured)

### **Tier 2: HIGH (Action Required Soon)**
- 🟡 Performance degradation (slow operations)
- 🟡 API quota warnings (approaching limits)
- 🟡 Edge function failures (specific function down)
- **Response Time:** < 1 hour
- **Notification:** Email

### **Tier 3: MEDIUM (Review Daily)**
- 🟢 Recurring errors (same error >100x)
- 🟢 New error types (first occurrence)
- **Response Time:** Next business day
- **Notification:** Daily digest

---

## **Step-by-Step: Alert Configuration**

### **1. Access Sentry Dashboard**

1. Navigate to https://sentry.io
2. Login with your credentials
3. Select **Verso Austral** project from project dropdown
4. Click **Alerts** in the left sidebar

---

### **2. Create Alert Rule: Error Rate Spike (CRITICAL)**

**Purpose:** Detect when error rate suddenly increases, indicating system-wide failure

**Steps:**
1. Click **"Create Alert Rule"** button
2. Select alert type: **"Issues"**
3. Configure **"When"** conditions:
   - **Trigger:** "The issue is seen more than X times in Y minutes"
   - **X:** `10`
   - **Y:** `5`
   - **Environment:** `production`
   - **Add filter:** `level:error OR level:fatal`
4. Configure **"Then"** actions:
   - Click **"Add Action"**
   - Select: **"Send a notification via Email"**
   - Recipients: Add your email address
   - (Optional) Add Slack integration:
     - Click **"Add Action"** again
     - Select: **"Send a notification via Slack"**
     - Select channel: `#verso-austral-alerts`
5. **Name the rule:** `[CRITICAL] Error Rate Spike - System Failure`
6. **Set frequency limit:** 
   - Scroll to **"Rate Limit"** section
   - Enable: "Send this alert at most once every `15` minutes"
7. Click **"Save Rule"**

**Expected behavior:** You'll receive immediate notification if >10 errors occur within 5 minutes.

---

### **3. Create Alert Rule: Database Errors (CRITICAL)**

**Purpose:** Detect fatal database errors immediately

**Steps:**
1. Create new alert rule
2. Select alert type: **"Issues"**
3. Configure conditions:
   - **Trigger:** "The issue is first seen"
   - **Environment:** `production`
   - **Add filters:**
     - `category:database`
     - `level:fatal`
4. Configure actions:
   - Email notification (your email)
   - (Optional) Slack notification
5. **Name:** `[CRITICAL] Database Fatal Error`
6. **Rate limit:** Once every 10 minutes
7. Save

**Expected behavior:** Immediate notification on first occurrence of database fatal error.

---

### **4. Create Alert Rule: Auth System Failures (CRITICAL)**

**Purpose:** Detect when authentication system is failing repeatedly

**Steps:**
1. Create new alert rule
2. Select alert type: **"Issues"**
3. Configure conditions:
   - **Trigger:** "The issue is seen more than X times in Y minutes"
   - **X:** `10`
   - **Y:** `10`
   - **Environment:** `production`
   - **Add filter:** `category:auth`
4. Actions: Email + (optional) Slack
5. **Name:** `[CRITICAL] Auth System Failures`
6. **Rate limit:** Once every 15 minutes
7. Save

---

### **5. Create Alert Rule: Edge Function Failures (HIGH)**

**Purpose:** Detect when specific edge function is failing repeatedly

**Steps:**
1. Create new alert rule
2. Select alert type: **"Issues"**
3. Configure conditions:
   - **Trigger:** "The issue is seen more than X times in Y minutes"
   - **X:** `20`
   - **Y:** `5`
   - **Environment:** `production`
   - **Add filter:** `edge_function:true`
4. Actions: Email
5. **Name:** `[HIGH] Edge Function Failures`
6. **Rate limit:** Once every 30 minutes
7. Save

---

### **6. Create Alert Rule: Performance Degradation (HIGH)**

**Purpose:** Detect slow operations affecting user experience

**Steps:**
1. Go to **Performance** tab (not Issues)
2. Click **"Create Alert"** in Performance section
3. Configure:
   - **Metric:** "Duration (p95)"
   - **Threshold:** `> 3000` (3 seconds)
   - **Environment:** `production`
   - **Filter by tag:** `performance:slow`
4. Configure actions:
   - **Action:** Email
   - **When:** Daily digest at 9:00 AM
5. **Name:** `[HIGH] Performance Degradation Detected`
6. Save

---

### **7. Create Alert Rule: API Quota Warning (HIGH)**

**Purpose:** Alert when approaching API quota limits (YouTube, Gemini, etc.)

**Steps:**
1. Create new alert rule
2. Select alert type: **"Issues"**
3. Configure conditions:
   - **Trigger:** "The issue is seen more than X times in Y minutes"
   - **X:** `5`
   - **Y:** `60`
   - **Environment:** `production`
   - **Add filter (text search):** `message contains "quota" OR message contains "rate limit"`
4. Actions: Email
5. **Name:** `[HIGH] API Quota Warning`
6. **Rate limit:** Once every 1 hour
7. Save

---

### **8. Create Alert Rule: Recurring Errors (MEDIUM)**

**Purpose:** Identify errors that happen frequently but aren't critical

**Steps:**
1. Create new alert rule
2. Select alert type: **"Issues"**
3. Configure conditions:
   - **Trigger:** "The issue is seen more than X times in Y hours"
   - **X:** `100`
   - **Y:** `24`
   - **Environment:** `production`
4. Actions: Email (daily digest)
5. **Name:** `[MEDIUM] Recurring Error Pattern`
6. **Rate limit:** Once every 24 hours
7. Save

---

### **9. Create Alert Rule: New Error Types (MEDIUM)**

**Purpose:** Get notified of new, never-seen-before errors

**Steps:**
1. Create new alert rule
2. Select alert type: **"Issues"**
3. Configure conditions:
   - **Trigger:** "The issue is first seen"
   - **Environment:** `production`
   - **Add filter:** `level:error`
4. Actions: Email (daily digest at 6:00 PM)
5. **Name:** `[MEDIUM] New Error Type Detected`
6. **Rate limit:** Once every 24 hours (daily digest)
7. Save

---

## **Slack Integration (Optional but Recommended)**

### **Setup Slack Workspace Integration**

1. In Sentry dashboard, go to **Settings** → **Integrations**
2. Search for **"Slack"**
3. Click **"Install"**
4. Click **"Add Workspace"**
5. Authorize Sentry to access your Slack workspace
6. Select default channel: `#verso-austral-alerts` (create if doesn't exist)
7. Click **"Install"**

### **Add Slack to Existing Alert Rules**

1. Go back to **Alerts** tab
2. Edit each CRITICAL and HIGH priority rule
3. In **"Then"** actions section:
   - Click **"Add Action"**
   - Select **"Send a notification via Slack"**
   - Choose channel: `#verso-austral-alerts`
4. Save rule

**Recommended Slack channels:**
- `#verso-austral-alerts` - All alerts
- `#verso-austral-critical` - Only CRITICAL alerts (optional)

---

## **Alert Testing**

### **1. Test Each Alert Rule**

After creating all rules, trigger test errors to verify alerts work:

**Frontend Error Test:**
```javascript
// In browser console
throw new Error('Test Alert: Frontend Critical Error');
```

**Backend Error Test:**
```bash
curl -X POST https://kywmhuubbsvclkorxrse.supabase.co/functions/v1/test-sentry-error \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### **2. Verify Alert Delivery**

Check within 5 minutes:
- ✅ Email received in inbox
- ✅ Slack message appears in channel (if configured)
- ✅ Alert details include error context and tags

### **3. Test Rate Limiting**

Trigger same error multiple times:
- First occurrence → Alert sent ✅
- Second occurrence within rate limit window → No alert (expected) ✅
- After rate limit window expires → Alert sent again ✅

---

## **Alert Tuning (After First Week)**

### **Baseline Metrics to Collect**

Monitor for 7 days to establish baseline:
- Average error rate per day
- P95 response time
- Most common error types
- Peak traffic hours

### **Adjust Thresholds**

After baseline established, tune alert rules:

**If too many false positives (alert fatigue):**
- ↑ Increase error count thresholds (e.g., 10 → 20)
- ↑ Increase time windows (e.g., 5min → 10min)
- ↑ Increase rate limits (e.g., 15min → 30min)

**If missing real issues:**
- ↓ Decrease error count thresholds
- ↓ Decrease time windows
- Add more specific filters

---

## **Alert Response Playbook**

### **When You Receive a CRITICAL Alert:**

1. **Acknowledge alert** (reply to email/Slack)
2. **Check Sentry dashboard** for full error details
3. **Check Supabase logs** (Lovable Cloud → Edge Functions)
4. **Assess impact:** How many users affected?
5. **Decide action:**
   - If critical: Deploy hotfix immediately
   - If transient: Monitor for 15 minutes
   - If known issue: Update alert rule to suppress
6. **Communicate:** Post in team chat about issue and ETA
7. **Resolve:** Deploy fix and monitor for 30 minutes
8. **Post-mortem:** Document root cause and prevention

### **When You Receive a HIGH Alert:**

1. **Review within 1 hour**
2. **Triage severity:** Is it affecting users now?
3. **Create task** in project management tool
4. **Schedule fix** in next sprint or hotfix
5. **Document** in team knowledge base

### **When You Receive a MEDIUM Alert:**

1. **Review during daily standup**
2. **Add to backlog** if actionable
3. **Ignore** if false positive (update filter)

---

## **Monitoring Dashboard Setup**

### **Create Custom Dashboard**

1. In Sentry, go to **Dashboards** tab
2. Click **"Create Dashboard"**
3. Name: **"Verso Austral - Production Health"**

### **Add Widgets:**

**Widget 1: Error Rate (Last 24h)**
- Type: Line chart
- Metric: Event count
- Group by: Level
- Filter: `environment:production`

**Widget 2: Top 10 Errors**
- Type: Table
- Metric: Event count
- Group by: Issue title
- Sort: Descending

**Widget 3: Errors by Feature**
- Type: Bar chart
- Metric: Event count
- Group by: Tag `feature`

**Widget 4: Performance (p95 Latency)**
- Type: Line chart
- Metric: Duration (p95)
- Filter: `performance:slow`

**Widget 5: Edge Function Health**
- Type: Table
- Metric: Event count
- Group by: Tag `function`
- Filter: `edge_function:true`

**Widget 6: Affected Users**
- Type: Number (big)
- Metric: Unique users
- Time window: Last 24 hours

---

## **Checklist: Alert Configuration Complete**

Use this checklist to verify all alerts are configured:

- [ ] Alert 1: Error Rate Spike (CRITICAL) - Email
- [ ] Alert 2: Database Errors (CRITICAL) - Email
- [ ] Alert 3: Auth Failures (CRITICAL) - Email
- [ ] Alert 4: Edge Function Failures (HIGH) - Email
- [ ] Alert 5: Performance Degradation (HIGH) - Email/Digest
- [ ] Alert 6: API Quota Warning (HIGH) - Email
- [ ] Alert 7: Recurring Errors (MEDIUM) - Digest
- [ ] Alert 8: New Error Types (MEDIUM) - Digest
- [ ] Slack integration configured (optional)
- [ ] Custom dashboard created
- [ ] All alerts tested and verified
- [ ] Rate limits configured to prevent alert fatigue
- [ ] Team playbook documented and shared

---

## **Cost Optimization**

### **Sentry Quotas**

Free tier typically includes:
- 5,000 errors/month
- 10,000 performance events/month

**To stay within limits:**
1. Use sample rate: `tracesSampleRate: 0.2` (20%) in production
2. Filter out non-critical errors in `beforeSend` hook
3. Increase `ignoreErrors` array for transient issues
4. Use `breadcrumbs` limit (50 max)

### **Monitor Quota Usage**

1. In Sentry, go to **Settings** → **Subscription**
2. View **"Usage Stats"** dashboard
3. Set budget alert at 80% of quota
4. If approaching limit:
   - Lower sample rate to 10%
   - Add more error filters
   - Upgrade plan if necessary

---

## **Maintenance**

### **Weekly Tasks**
- [ ] Review alert effectiveness (false positives?)
- [ ] Check if new error patterns emerged
- [ ] Update filters based on recurring noise

### **Monthly Tasks**
- [ ] Review and archive resolved issues
- [ ] Update alert thresholds based on growth
- [ ] Clean up outdated custom filters
- [ ] Review quota usage and adjust sample rates

### **Quarterly Tasks**
- [ ] Audit all alert rules (still relevant?)
- [ ] Update playbook based on lessons learned
- [ ] Review Sentry plan (upgrade if needed)
- [ ] Team training on new Sentry features

---

**Status**: Ready for configuration ✅  
**Estimated setup time**: 30-45 minutes  
**Last Updated**: 2025-01-24
