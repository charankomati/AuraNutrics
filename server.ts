import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

const db = new Database("auranutrics.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_name TEXT,
    calories REAL,
    protein REAL,
    carbs REAL,
    fat REAL,
    insights TEXT,
    risk TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cohorts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    deficiency_risk REAL,
    metabolic_efficiency REAL
  );

  CREATE TABLE IF NOT EXISTS rda_standards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    age_group TEXT,
    nutrient TEXT,
    value REAL,
    rda REAL,
    unit TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    message TEXT,
    type TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    type TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER,
    weight REAL,
    height REAL,
    gender TEXT,
    activity_level TEXT,
    goal TEXT,
    diet_type TEXT,
    allergies TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data if empty
const cohortCount = db.prepare("SELECT COUNT(*) as count FROM cohorts").get() as { count: number };
if (cohortCount.count === 0) {
  const insertCohort = db.prepare("INSERT INTO cohorts (name, deficiency_risk, metabolic_efficiency) VALUES (?, ?, ?)");
  insertCohort.run("Group A (4-8y)", 12, 88);
  insertCohort.run("Group B (9-13y)", 24, 76);
  insertCohort.run("Group C (14-18y)", 18, 82);

  const insertRDA = db.prepare("INSERT INTO rda_standards (age_group, nutrient, value, rda, unit) VALUES (?, ?, ?, ?, ?)");
  // Pediatric
  insertRDA.run("pediatric", "Vitamin A", 400, 500, "mcg");
  insertRDA.run("pediatric", "Iron", 7, 10, "mg");
  insertRDA.run("pediatric", "Zinc", 3, 5, "mg");
  insertRDA.run("pediatric", "Calcium", 700, 1000, "mg");
  // Adolescent
  insertRDA.run("adolescent", "Vitamin A", 700, 900, "mcg");
  insertRDA.run("adolescent", "Iron", 11, 15, "mg");
  insertRDA.run("adolescent", "Zinc", 8, 11, "mg");
  insertRDA.run("adolescent", "Calcium", 1100, 1300, "mg");

  const insertNotification = db.prepare("INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)");
  insertNotification.run("Metabolic Alert", "Sub-clinical Vitamin D deficiency risk detected.", "warning");
  insertNotification.run("System Update", "RDA Benchmarks updated to 2026 standards.", "info");

  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("age_group", "pediatric");

  db.prepare(`
    INSERT INTO user_profile (name, age, weight, height, gender, activity_level, goal, diet_type, allergies)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run("User", 12, 42.5, 152, "Male", "Moderate", "Growth Optimization", "Balanced", "None");
} else {
  // Update existing record if it was the old default
  db.prepare("UPDATE user_profile SET name = 'User' WHERE name = 'Julian Vane'").run();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/user/profile", (req, res) => {
    let profile = db.prepare("SELECT * FROM user_profile LIMIT 1").get();
    if (!profile) {
      // Fallback seed if somehow missing
      db.prepare(`
        INSERT INTO user_profile (name, age, weight, height, gender, activity_level, goal, diet_type, allergies)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run("User", 12, 42.5, 152, "Male", "Moderate", "Growth Optimization", "Balanced", "None");
      profile = db.prepare("SELECT * FROM user_profile LIMIT 1").get();
    }
    res.json(profile || {});
  });

  app.post("/api/user/profile", (req, res) => {
    const { name, age, weight, height, gender, activity_level, goal, diet_type, allergies } = req.body;
    db.prepare(`
      UPDATE user_profile 
      SET name = ?, age = ?, weight = ?, height = ?, gender = ?, activity_level = ?, goal = ?, diet_type = ?, allergies = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(name, age, weight, height, gender, activity_level, goal, diet_type, allergies);
    res.json({ status: "ok" });
  });

  app.get("/api/rda", (req, res) => {
    const ageGroup = req.query.ageGroup || db.prepare("SELECT value FROM settings WHERE key = 'age_group'").get().value;
    const rda = db.prepare("SELECT * FROM rda_standards WHERE age_group = ?").all(ageGroup);
    const formattedRda = rda.reduce((acc: any, curr: any) => {
      acc[curr.nutrient.toLowerCase().replace(" ", "")] = { value: curr.value, rda: curr.rda, unit: curr.unit };
      return acc;
    }, {});
    res.json({ [ageGroup]: formattedRda });
  });

  app.get("/api/cohorts", (req, res) => {
    const cohorts = db.prepare("SELECT * FROM cohorts").all();
    res.json(cohorts);
  });

  app.get("/api/meals", (req, res) => {
    const query = req.query.search ? `%${req.query.search}%` : '%';
    const meals = db.prepare("SELECT * FROM meals WHERE food_name LIKE ? ORDER BY created_at DESC LIMIT 20").all(query);
    res.json(meals);
  });

  app.post("/api/meals", (req, res) => {
    const { foodName, calories, macronutrients, healthInsights, predictiveRisk } = req.body;
    const insert = db.prepare(`
      INSERT INTO meals (food_name, calories, protein, carbs, fat, insights, risk)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insert.run(foodName, calories, macronutrients.protein, macronutrients.carbs, macronutrients.fat, healthInsights, predictiveRisk);
    
    // Auto-generate notification for high risk
    if (predictiveRisk.toLowerCase().includes("high") || predictiveRisk.toLowerCase().includes("deficiency")) {
      db.prepare("INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)").run(
        "Nutritional Risk",
        `High risk detected in recent ingestion: ${foodName}`,
        "warning"
      );
    }
    
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/meals/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM meals WHERE id = ?").run(id);
    res.json({ status: "ok" });
  });

  app.get("/api/notifications", (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10").all();
    res.json(notifications);
  });

  app.post("/api/notifications/read", (req, res) => {
    db.prepare("UPDATE notifications SET is_read = 1").run();
    res.json({ status: "ok" });
  });

  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const formatted = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(formatted);
  });

  app.post("/api/settings", (req, res) => {
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
    res.json({ status: "ok" });
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    // Mock authentication
    if (email && password === "aura2026") {
      res.json({ success: true, user: { name: "User", email } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials. Hint: use 'aura2026' as password." });
    }
  });

  app.get("/api/biometrics", (req, res) => {
    res.json({
      heartRate: 72 + Math.floor(Math.random() * 10 - 5),
      metabolicRate: 1450 + Math.floor(Math.random() * 100 - 50),
      activityLevel: "Moderate",
      sleepQuality: 0.85,
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/interventions", (req, res) => {
    const interventions = db.prepare("SELECT * FROM interventions ORDER BY created_at DESC LIMIT 10").all();
    res.json(interventions);
  });

  app.post("/api/interventions", (req, res) => {
    const { title, type } = req.body;
    db.prepare("INSERT INTO interventions (title, type, status) VALUES (?, ?, ?)").run(title, type, "Active");
    res.json({ status: "ok" });
  });

  app.get("/api/admin/export", (req, res) => {
    const meals = db.prepare("SELECT * FROM meals").all();
    const profile = db.prepare("SELECT * FROM user_profile LIMIT 1").get();
    const data = {
      export_date: new Date().toISOString(),
      user_profile: profile,
      nutritional_history: meals
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=auranutrics_export.json');
    res.send(JSON.stringify(data, null, 2));
  });

  app.get("/api/health/summary", (req, res) => {
    const profile = db.prepare("SELECT * FROM user_profile LIMIT 1").get();
    const meals = db.prepare("SELECT * FROM meals ORDER BY created_at DESC LIMIT 50").all();
    const biometrics = {
      heartRate: 72 + Math.floor(Math.random() * 10 - 5),
      metabolicRate: 1450 + Math.floor(Math.random() * 100 - 50),
      activityLevel: profile?.activity_level || "Moderate",
      sleepQuality: 0.85,
      timestamp: new Date().toISOString()
    };
    res.json({ profile, meals, biometrics });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AuraNutrics Server running on http://localhost:${PORT}`);
  });
}

startServer();
