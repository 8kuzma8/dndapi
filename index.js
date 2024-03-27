import express from 'express';
import fetch from 'node-fetch';
import pkg from 'pg';
const { Pool } = pkg;


const app = express();
const db = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'dnddb',
    password: 'admin',
    port: 5432,
});

const getClassByName = async (name) => {
    const result = await db.query('SELECT * FROM classes WHERE name = $1', [name]);
    return result.rows[0];
};

const saveClass = async (name, hitPoints, proficiencies) => {
    await db.query(
        'INSERT INTO classes (name, hit_points, proficiencies) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING', 
        [name, hitPoints, JSON.stringify(proficiencies)]
    );
};

app.get('/class/:name', async (req, res) => {
    try {
        const className = req.params.name;
        let classData = await getClassByName(className);

        if (!classData) {
            const response = await fetch(`https://www.dnd5eapi.co/api/classes/${className.toLowerCase()}`);
            if (!response.ok) return res.status(404).send('Class not found in D&D 5e API');
            
            const data = await response.json();
            
            const hitPoints = data.hit_die;
            const proficiencies = data.proficiencies.map(p => p.name);

            await saveClass(className, hitPoints, proficiencies);
            classData = { name: className, hit_points: hitPoints, proficiencies };
        }

        res.json(classData);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
