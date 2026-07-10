/**
 * Seeds the database with realistic demo data for local development.
 *
 *   npm run seed
 *
 * Refuses to run against NODE_ENV=production. Wipes the core collections, then
 * creates a shared workspace, members, projects, and a spread of tasks
 * (statuses, priorities, due dates, checklists) plus a few comments.
 */
import mongoose from 'mongoose';

import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import {
  ROLES,
  TASK_PRIORITY,
  TASK_STATUS,
} from '../constants/index.js';
import {
  ActivityLog,
  Comment,
  Invitation,
  Notification,
  Project,
  Task,
  TaskSuggestion,
  TimeEntry,
  User,
  Workspace,
} from '../models/index.js';

const PASSWORD = 'Password1';

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const run = async () => {
  if (env.isProd) {
    logger.error('Refusing to seed a production database. Aborting.');
    process.exit(1);
  }

  await connectDatabase();
  logger.info('Clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Workspace.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
    Notification.deleteMany({}),
    ActivityLog.deleteMany({}),
    Invitation.deleteMany({}),
    TaskSuggestion.deleteMany({}),
    TimeEntry.deleteMany({}),
  ]);

  // --- Users ---
  logger.info('Creating users…');
  const [owner, alice, bob, carol] = await User.create([
    { name: 'Demo Owner', email: 'owner@taskcontrol.app', password: PASSWORD, bio: 'Keeping the ship steady.' },
    { name: 'Alice Ng', email: 'alice@taskcontrol.app', password: PASSWORD, bio: 'Frontend craft.' },
    { name: 'Bob Reyes', email: 'bob@taskcontrol.app', password: PASSWORD, bio: 'Backend & infra.' },
    { name: 'Carol Smith', email: 'carol@taskcontrol.app', password: PASSWORD, bio: 'Design systems.' },
  ]);
  const everyone = [owner, alice, bob, carol];

  // --- Workspace ---
  logger.info('Creating workspace…');
  const workspace = await Workspace.create({
    name: 'Acme Product Team',
    slug: 'acme-product-team',
    description: 'Where Acme plans and ships product work.',
    owner: owner.id,
    members: [
      { user: owner.id, role: ROLES.OWNER },
      { user: alice.id, role: ROLES.ADMIN },
      { user: bob.id, role: ROLES.MANAGER },
      { user: carol.id, role: ROLES.MEMBER },
    ],
  });

  // --- Projects ---
  logger.info('Creating projects…');
  const projectsSpec = [
    { name: 'Web Platform', key: 'WEB', color: '#5A3BFF', icon: 'globe' },
    { name: 'Mobile App', key: 'MOB', color: '#8B5CF6', icon: 'smartphone' },
    { name: 'Design System', key: 'DS', color: '#EC4899', icon: 'palette' },
  ];
  const projects = [];
  for (const spec of projectsSpec) {
     
    const project = await Project.create({
      workspace: workspace.id,
      name: spec.name,
      key: spec.key,
      color: spec.color,
      icon: spec.icon,
      description: `${spec.name} initiatives and roadmap.`,
      lead: pick(everyone).id,
      members: everyone.map((u) => ({ user: u.id, role: ROLES.MEMBER })),
      createdBy: owner.id,
    });
    projects.push(project);
  }

  // --- Tasks ---
  logger.info('Creating tasks…');
  const titles = [
    'Set up authentication flow',
    'Design the dashboard layout',
    'Implement drag-and-drop board',
    'Write API documentation',
    'Add dark mode support',
    'Optimize image loading',
    'Build notification center',
    'Create onboarding wizard',
    'Fix timezone handling',
    'Add export to CSV',
    'Refactor task service',
    'Improve search relevance',
  ];
  const statuses = Object.values(TASK_STATUS).filter((s) => s !== 'cancelled');
  const priorities = Object.values(TASK_PRIORITY);

  let created = 0;
  for (const project of projects) {
    for (let i = 0; i < 8; i += 1) {
      const status = pick(statuses);
      const number = i + 1;
       
      await Project.findByIdAndUpdate(project.id, { $inc: { taskCounter: 1 } });
      const dueOffset = pick([-3, -1, 0, 1, 2, 5, 9, null]);
       
      const task = await Task.create({
        workspace: workspace.id,
        project: project.id,
        number,
        key: `${project.key}-${number}`,
        title: pick(titles),
        description: 'Auto-generated demo task. Edit me to see live updates.',
        status,
        priority: pick(priorities),
        tags: pick([['frontend'], ['backend'], ['design'], ['frontend', 'urgent'], []]),
        reporter: owner.id,
        assignee: pick(everyone).id,
        estimatedHours: pick([2, 4, 8, 0]),
        dueDate: dueOffset === null ? null : daysFromNow(dueOffset),
        completedAt: status === TASK_STATUS.DONE ? new Date() : null,
        order: i,
        checklist:
          i % 2 === 0
            ? [
                { text: 'Draft the approach', done: true, completedAt: new Date(), completedBy: alice.id },
                { text: 'Implement', done: status === TASK_STATUS.DONE },
                { text: 'Write tests', done: false },
              ]
            : [],
        createdBy: owner.id,
      });
      created += 1;

      if (i % 3 === 0) {
         
        await Comment.create({
          workspace: workspace.id,
          task: task.id,
          author: pick(everyone).id,
          body: 'Looks good — let me know if you need a hand here.',
        });
         
        await Task.findByIdAndUpdate(task.id, { $inc: { commentCount: 1 } });
      }

       
      await ActivityLog.create({
        workspace: workspace.id,
        project: project.id,
        task: task.id,
        actor: owner.id,
        action: 'created',
        entityType: 'task',
        entityId: task.id,
        message: `created ${task.key}`,
      });
    }
  }

  // --- A suggestion + a notification ---
  await TaskSuggestion.create({
    workspace: workspace.id,
    title: 'Add keyboard shortcuts',
    description: 'Power users would love j/k navigation on the board.',
    priority: TASK_PRIORITY.MEDIUM,
    suggestedBy: bob.id,
    suggestedTo: alice.id,
  });
  await Notification.create({
    recipient: alice.id,
    workspace: workspace.id,
    type: 'task_suggestion',
    actor: bob.id,
    title: 'New task suggestion',
    body: 'Bob suggested a task: Add keyboard shortcuts',
    link: '/app/suggestions',
  });

  logger.info('──────────────────────────────────────────────');
  logger.info(`✅ Seeded ${everyone.length} users, 1 workspace, ${projects.length} projects, ${created} tasks`);
  logger.info('   Log in with any of:');
  everyone.forEach((u) => logger.info(`     ${u.email}  /  ${PASSWORD}`));
  logger.info('──────────────────────────────────────────────');

  await disconnectDatabase();
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  logger.error(`Seed failed: ${err.stack}`);
  process.exit(1);
});
