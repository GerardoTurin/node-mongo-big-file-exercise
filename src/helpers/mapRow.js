


// Mapeao cada fila del archivo CSV.
const mapRow = (row) => {
    return {
        id: Number(row.id),
        firstname: row.firstname.trim(),
        lastname: row.lastname.trim(),
        email: row.email.trim(),
        email2: row.email2.trim(),
        profession: row.profession.trim()
    };
}

module.exports = { mapRow };
