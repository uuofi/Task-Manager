import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, CheckCircle2, LayoutDashboard, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Unified dashboard',
    description: "Today's tasks, overdue work, project progress and activity in one calm view.",
  },
  {
    icon: Zap,
    title: 'Realtime everything',
    description: 'Live comments, presence, typing indicators and instant notifications.',
  },
  {
    icon: CalendarClock,
    title: 'Time tracking',
    description: 'Built-in timers turn focused work into accurate actual-hour reporting.',
  },
  {
    icon: CheckCircle2,
    title: 'Smart workflows',
    description: 'Backlog → Done with dependencies, recurring tasks and suggestions.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export function LandingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg">
              TC
            </span>
            TaskControl
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6">
        <section className="py-20 text-center sm:py-28">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <span className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <span className="bg-success size-1.5 rounded-full" /> Built for high-performing teams
            </span>
          </motion.div>
          <motion.h1
            initial="hidden"
            animate="show"
            custom={1}
            variants={fadeUp}
            className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl"
          >
            The task platform your team will actually enjoy using
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="show"
            custom={2}
            variants={fadeUp}
            className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg text-pretty"
          >
            Plan projects, track time, collaborate in realtime and never miss a deadline — all in a
            beautifully minimal workspace.
          </motion.p>
          <motion.div
            initial="hidden"
            animate="show"
            custom={3}
            variants={fadeUp}
            className="mt-10 flex items-center justify-center gap-3"
          >
            <Button asChild size="lg" variant="cta">
              <Link to="/register">
                Start free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Live demo</Link>
            </Button>
          </motion.div>
        </section>

        {/* Features */}
        <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
            >
              <Card className="h-full">
                <CardContent className="flex flex-col gap-3">
                  <feature.icon className="text-primary size-6" />
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>
      </main>

      <footer className="text-muted-foreground border-t py-8 text-center text-sm">
        © {new Date().getFullYear()} TaskControl. Crafted for teams that ship.
      </footer>
    </div>
  );
}

export default LandingPage;
